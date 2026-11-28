# What we have built

Status checked on GitHub 2026-11-28, evening session. Recheck before relying on it. [Handoff](HANDOFF.md).

## Upstream pull requests (open)

| PR                                                  | Issue                                               | What                                           | State                                                                      | Owner action             |
| --------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------- | ------------------------ |
| [#12743](https://github.com/morluto/rea/pull/12743) | [#2389](https://github.com/morluto/rea/issues/2389) | Select exact solc compiler artifacts           | Ready; boxes ticked; checks pass; old maintainer comments addressed        | Wait for review          |
| [#14951](https://github.com/morluto/rea/pull/14951) | [#2393](https://github.com/morluto/rea/issues/2393) | `inspect_evm_proxy`                            | Ready; 5/5; **boxes unticked**                                             | Review and tick          |
| [#14953](https://github.com/morluto/rea/pull/14953) | [#2393](https://github.com/morluto/rea/issues/2393) | Proxy chains; after #14951                     | Ready; 5/5; **boxes unticked**; one Codex thread left open after our reply | Review and tick          |
| [#14967](https://github.com/morluto/rea/pull/14967) | [#2388](https://github.com/morluto/rea/issues/2388) | `verify_solidity_metadata`; closes the issue   | Ready; boxes ticked; 5/5                                                   | Wait for review          |
| [#14977](https://github.com/morluto/rea/pull/14977) | [#3687](3687-vscode-extensions.md)                  | Part 1: commands                               | Draft; 5/5                                                                 | Review, tick, mark ready |
| [#14978](https://github.com/morluto/rea/pull/14978) | [#3687](3687-vscode-extensions.md)                  | Part 2: AI contributions; after #14977         | Draft; 5/5                                                                 | After the one below      |
| [#14979](https://github.com/morluto/rea/pull/14979) | [#3687](3687-vscode-extensions.md)                  | Part 3: views, editors, settings; after #14978 | Draft; 5/5                                                                 | After the one below      |

All were mergeable with passing checks when checked.

## Replies

- #2393: matbrgz (issue author) replied "go ahead, all PRs are welcome" on 2026-11-28.
- #3687: mvanhorn released the next part to us; no word from morluto.

## Fork only

[Fork PRs 1 to 4](https://github.com/akshad-exe/rea/pulls) mirror the VS Code parts; #4 (debugger types) is unit tested only and has no upstream PR.

## Planned or waiting

| Issue                                                                     | State                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [#2392](../blockchain-notes/plans/2392-storage-layout.md) storage layouts | Planned; waits for #12743; no comment posted                  |
| [#3672](3672-agent-protocols.md) agent protocols                          | Noted to work on; not claimed; draft scope comment not posted |
| #3687 remaining                                                           | Installed folders, webview messaging, server processes        |

## Places that will conflict

New tools edit the tool lists, CLI command files, the error observation union and both skill files. Expect a small resolution for whichever merges second.
