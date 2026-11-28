import type { Logger } from "pino";

import { createVsixPackageService } from "../composition/vsixPackage.js";
import { VSIX_PACKAGE_TOOL_CONTRACTS } from "../contracts/vsix/vsixPackageToolContracts.js";
import { contractNamed } from "./contractCliDescription.js";
import { registerContractCommand } from "./contractCommand.js";
import { deliverWithService } from "./contractCommandRunners.js";
import type { CliInstance } from "./types.js";

/** Inspect operator-selected VS Code extensions through the same shared workflow as MCP. */
export const registerVsixPackageCommands = (
  cli: CliInstance,
  logger: Logger,
): void => {
  registerContractCommand(
    cli,
    logger,
    contractNamed(VSIX_PACKAGE_TOOL_CONTRACTS, "inspect_vsix_package"),
    {
      description:
        "Inspect VS Code .vsix or installed extension identity, activation, contributes and contents without install or network",
      positionals: ["path"],
      callerPaths: ["path"],
      evidenceDelivery: true,
      fields: {
        path: {
          description:
            "Local VS Code .vsix package or installed extension folder",
        },
      },
    },
    deliverWithService(createVsixPackageService, "rea-vsix-package"),
  );
};
