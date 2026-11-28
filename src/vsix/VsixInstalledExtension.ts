import { directoryTreeDigest } from "../domain/directoryTreeDigest.js";
import type { DirectoryTreeRecord } from "../domain/directoryTreeDigest.js";
import { decodeLimit, malformedInput } from "../domain/parseFailure.js";
import {
  VSIX_PACKAGE_FORMAT,
  type InspectVsixPackageInput,
  type VsixPackage,
} from "../domain/vsix/vsixPackage.js";
import { sha256Hex } from "../kernel/sha256Hex.js";
import type { DirectoryArtifactReader } from "../resources/index.js";
import {
  decodeVsixListing,
  type VsixSourceMember,
} from "./VsixPackageParser.js";

export const VSIX_FOLDER_LIMITATIONS = {
  noExecution:
    "This workflow reads an installed extension folder, mapping its files under extension/ and its .vsixmanifest to extension.vsixmanifest, without executing the extension or contacting a marketplace.",
  signaturesUnverified:
    "Signature files are not verified, and an installed folder may differ from the package it was installed from.",
  symlink: (path: string) =>
    `Symbolic link ${JSON.stringify(path)} was not followed and is not listed as a member.`,
} as const;

/** VS Code keeps the package manifest beside the extension's own files. */
const memberName = (path: string): string =>
  path === ".vsixmanifest" ? "extension.vsixmanifest" : `extension/${path}`;

/**
 * Read one installed extension folder within the package budgets and decode it
 * as a package. Links are never followed, and a folder with an unexamined
 * entry is refused because it has no complete tree identity.
 */
export const parseInstalledExtension = async (
  reader: DirectoryArtifactReader,
  input: InspectVsixPackageInput,
  signal?: AbortSignal,
): Promise<VsixPackage> => {
  const unexamined: string[] = [];
  const records: DirectoryTreeRecord[] = [];
  const members: VsixSourceMember[] = [];
  const limitations: string[] = [
    VSIX_FOLDER_LIMITATIONS.noExecution,
    VSIX_FOLDER_LIMITATIONS.signaturesUnverified,
  ];
  let examined = 0;
  let total = 0;
  const overBytes = (required: number) =>
    decodeLimit(
      VSIX_PACKAGE_FORMAT,
      `Extension folder files exceed the ${String(input.max_file_bytes)}-byte budget.`,
      { name: "max_file_bytes", maximum: input.max_file_bytes, required },
    );
  for await (const entry of reader.entries(signal, {
    onOmission: ({ path }) => unexamined.push(path),
    onCoverage: (coverage) => {
      if (coverage.status !== "complete")
        unexamined.push(...coverage.limitations);
    },
  })) {
    examined += 1;
    if (examined > input.max_entries)
      throw decodeLimit(
        VSIX_PACKAGE_FORMAT,
        `Extension folder exceeds the ${String(input.max_entries)}-entry budget.`,
        { name: "max_entries", maximum: input.max_entries, required: examined },
      );
    if (entry.kind === "directory") {
      records.push({ kind: "directory", path: entry.path });
      continue;
    }
    if (entry.kind === "symlink") {
      if (entry.linkTarget === undefined) unexamined.push(entry.path);
      else {
        records.push({
          kind: "symlink",
          path: entry.path,
          targetHex: entry.linkTarget.hex,
        });
        limitations.push(VSIX_FOLDER_LIMITATIONS.symlink(entry.path));
      }
      continue;
    }
    // Refuse on the listed size before any of the file is read.
    if (total + (entry.declaredSize ?? 0) > input.max_file_bytes)
      throw overBytes(total + (entry.declaredSize ?? 0));
    const chunks: Buffer[] = [];
    for await (const chunk of await reader.open(entry, signal)) {
      total += (chunk as Buffer).length;
      if (total > input.max_file_bytes) throw overBytes(total);
      chunks.push(chunk as Buffer);
    }
    const bytes = Buffer.concat(chunks);
    records.push({ kind: "file", path: entry.path, sha256: sha256Hex(bytes) });
    const name = memberName(entry.path);
    members.push({
      sourceName: name,
      nameLimitations: [],
      encrypted: false,
      uncompressedSize: bytes.length,
      compressedSize: null,
      unixExecutable: entry.executable,
      read: (maximum, label, limitName) =>
        bytes.length > maximum
          ? Promise.reject(
              decodeLimit(
                VSIX_PACKAGE_FORMAT,
                `${label} exceeds the ${String(maximum)}-byte budget.`,
                { name: limitName, maximum, required: bytes.length },
              ),
            )
          : Promise.resolve(bytes),
    });
  }
  if (unexamined.length > 0)
    throw malformedInput(
      VSIX_PACKAGE_FORMAT,
      `Extension folder holds entries that could not be examined: ${unexamined.join(", ")}`,
    );
  return decodeVsixListing(
    { members, status: "complete", limitations },
    {
      path: input.path,
      sha256: directoryTreeDigest(records),
      bytes: total,
      tree: { algorithm: "rea-directory-tree", version: 1 },
    },
    input,
  );
};
