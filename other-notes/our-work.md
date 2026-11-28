# What we have built

Status 2026-11-28. Recheck on GitHub before relying on it.

| Issue                                               | What                                                                  | Where                                               | State                               |
| --------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------- |
| [#2389](https://github.com/morluto/rea/issues/2389) | Select exact solc compiler artifacts                                  | [#12743](https://github.com/morluto/rea/pull/12743) | Open, awaiting review               |
| [#2393](https://github.com/morluto/rea/issues/2393) | `inspect_evm_proxy`: clone proxies and supplied storage slots         | [#14951](https://github.com/morluto/rea/pull/14951) | Draft                               |
| [#2393](https://github.com/morluto/rea/issues/2393) | Follow proxy chains                                                   | [#14953](https://github.com/morluto/rea/pull/14953) | Draft; after #14951                 |
| [#2388](https://github.com/morluto/rea/issues/2388) | `verify_solidity_metadata`: metadata file against bytecode commitment | [#14967](https://github.com/morluto/rea/pull/14967) | Draft; closes the issue once merged |

## Planned or waiting

| Issue                                                                     | State                                        |
| ------------------------------------------------------------------------- | -------------------------------------------- |
| [#2392](../blockchain-notes/plans/2392-storage-layout.md) storage layouts | Planned; waits for #12743; no comment posted |
| [#3687](3687-vscode-extensions.md) VS Code extensions                     | Comment posted; waiting for a reply          |
| [#3672](3672-agent-protocols.md) agent protocols                          | Noted to work on; not claimed                |

## Places that will conflict

New tools edit the tool lists, `src/cli/evmCommands.ts`, the error observation union and both skill files. Expect a small resolution for whichever merges second.
