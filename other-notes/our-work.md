# What we have built

Status 2026-11-28. Recheck on GitHub before relying on it.

| Issue                                               | What                                                                      | Where                                               | State                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------- |
| [#2389](https://github.com/morluto/rea/issues/2389) | Select exact solc compiler artifacts                                      | [#12743](https://github.com/morluto/rea/pull/12743) | Ready; awaiting review                              |
| [#2393](https://github.com/morluto/rea/issues/2393) | `inspect_evm_proxy`: clone proxies and supplied storage slots             | [#14951](https://github.com/morluto/rea/pull/14951) | Ready; CI passed, 5/5; boxes unticked               |
| [#2393](https://github.com/morluto/rea/issues/2393) | Follow proxy chains                                                       | [#14953](https://github.com/morluto/rea/pull/14953) | Ready; CI passed, 5/5; boxes unticked; after #14951 |
| [#2388](https://github.com/morluto/rea/issues/2388) | `verify_solidity_metadata`: metadata file against bytecode commitment     | [#14967](https://github.com/morluto/rea/pull/14967) | Draft; CI passed, 5/5; closes the issue once merged |
| [#3687](3687-vscode-extensions.md)                  | Link VS Code extension commands to their handlers (part 1 of 6 remaining) | branch `feat/vsix-command-handlers`                 | In progress; mvanhorn agreed                        |

## Planned or waiting

| Issue                                                                     | State                                        |
| ------------------------------------------------------------------------- | -------------------------------------------- |
| [#2392](../blockchain-notes/plans/2392-storage-layout.md) storage layouts | Planned; waits for #12743; no comment posted |
| [#3672](3672-agent-protocols.md) agent protocols                          | Noted to work on; not claimed                |

## Places that will conflict

New tools edit the tool lists, `src/cli/evmCommands.ts`, the error observation union and both skill files. Expect a small resolution for whichever merges second.
