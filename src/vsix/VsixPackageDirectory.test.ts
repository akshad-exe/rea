import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";

import { VsixPackageService } from "../application/vsix/VsixPackageService.js";
import { vsixPackageSchema } from "../domain/vsix/vsixPackage.js";
import { createTestTempDirectory } from "../../tests/fixtures/temporaryDirectory.js";
import { VsixPackageProvider } from "./VsixPackageProvider.js";

const installed = async () => {
  const root = await createTestTempDirectory("rea-vsix-installed-");
  await mkdir(join(root, "out"));
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      name: "hello",
      publisher: "demo",
      version: "1.2.3",
      main: "./out/extension",
      contributes: { commands: [{ command: "demo.run" }] },
    }),
  );
  await writeFile(
    join(root, ".vsixmanifest"),
    '<PackageManifest xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011"><Metadata><Identity Id="hello" Version="1.2.3" Publisher="demo"/></Metadata></PackageManifest>',
  );
  await writeFile(join(root, "out", "extension.js"), "exports.a = 1;\n");
  await writeFile(
    join(root, "out", "tool.wasm"),
    Buffer.from("\0asm\x01\0\0\0"),
  );
  return root;
};

const inspect = async (input: Record<string, unknown>) => {
  const service = new VsixPackageService(new VsixPackageProvider());
  try {
    return await service.inspect(input);
  } finally {
    await service.close();
  }
};

it("reads an installed extension folder under a directory tree identity", async () => {
  const root = await installed();
  await symlink("/etc/hostname", join(root, "out", "link.js"));
  const result = await inspect({ path: root });
  if (!result.ok) throw result.error;
  const evidence = result.value;
  const report = vsixPackageSchema.parse(evidence.normalized_result);
  expect(evidence.subject.identity).toMatchObject({
    kind: "directory",
    sha256: report.artifact.sha256,
  });
  expect(report.package_identity?.name).toBe("hello");
  expect(report.vsix_identity?.id).toBe("hello");
  expect(report.entry_points.main).toEqual({
    path: "extension/out/extension.js",
    present: true,
  });
  expect(report.interesting_members).toMatchObject([
    { path: "extension/out/tool.wasm", kind: "wasm" },
  ]);
  expect(report.contents.map(({ path }) => path)).not.toContain(
    "extension/out/link.js",
  );
  expect(report.limitations.join("\n")).toContain("out/link.js");
});

it.each([
  ["max_entries", 1],
  ["max_file_bytes", 16],
])("refuses a folder above %s", async (parameter, value) => {
  const result = await inspect({ path: await installed(), [parameter]: value });
  expect(result.ok).toBe(false);
  if (!result.ok)
    expect(JSON.stringify(result.error)).toContain(String(parameter));
});
