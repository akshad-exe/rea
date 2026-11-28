# What we have built

Status checked on GitHub 2026-11-28, evening session. Recheck before relying on it. [Handoff](HANDOFF.md) · [Issues dashboard](../dashboard/README.md).

## Upstream pull requests (open)

| PR                                                  | Issue                                               | What                                           | State                                                                | Owner action        |
| --------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------- | ------------------- |
| [#12743](https://github.com/morluto/rea/pull/12743) | [#2389](https://github.com/morluto/rea/issues/2389) | Select exact solc compiler artifacts           | Ready; boxes ticked; checks pass; old maintainer comments addressed  | Wait for review     |
| [#14951](https://github.com/morluto/rea/pull/14951) | [#2393](https://github.com/morluto/rea/issues/2393) | `inspect_evm_proxy`                            | Ready; 5/5; boxes ticked                                             | Wait for review     |
| [#14953](https://github.com/morluto/rea/pull/14953) | [#2393](https://github.com/morluto/rea/issues/2393) | Proxy chains; after #14951                     | Ready; 5/5; boxes ticked; one Codex thread left open after our reply | Wait for review     |
| [#14967](https://github.com/morluto/rea/pull/14967) | [#2388](https://github.com/morluto/rea/issues/2388) | `verify_solidity_metadata`; closes the issue   | Ready; boxes ticked; 5/5                                             | Wait for review     |
| [#14977](https://github.com/morluto/rea/pull/14977) | [#3687](../other-issues/3687-vscode-extensions.md)  | Part 1: commands                               | Ready; 5/5; boxes ticked                                             | Wait for review     |
| [#14978](https://github.com/morluto/rea/pull/14978) | [#3687](../other-issues/3687-vscode-extensions.md)  | Part 2: AI contributions; after #14977         | Draft; 5/5; boxes ticked                                             | After the one below |
| [#14979](https://github.com/morluto/rea/pull/14979) | [#3687](../other-issues/3687-vscode-extensions.md)  | Part 3: views, editors, settings; after #14978 | Draft; 5/5; boxes ticked                                             | After the one below |

All were mergeable with passing checks when checked.

## Replies

- #2393: matbrgz (issue author) replied "go ahead, all PRs are welcome" on 2026-11-28.
- #3687: mvanhorn released the next part to us; no word from morluto.
- #3687: posted an update on 2026-11-28 asking morluto to review the open PRs (comment 7237981346); #14977 marked ready.

## Fork pull requests

| Fork PR                                        | #3687 part | Content                          | Upstream   |
| ---------------------------------------------- | ---------- | -------------------------------- | ---------- |
| [#1](https://github.com/akshad-exe/rea/pull/1) | 1          | Commands                         | #14977     |
| [#2](https://github.com/akshad-exe/rea/pull/2) | 2          | AI contributions                 | #14978     |
| [#3](https://github.com/akshad-exe/rea/pull/3) | 3          | Views, custom editors, settings  | #14979     |
| [#5](https://github.com/akshad-exe/rea/pull/5) | 4          | Installed extension folders      | not raised |
| [#6](https://github.com/akshad-exe/rea/pull/6) | 5          | Webview messages and fixed HTML  | not raised |
| [#7](https://github.com/akshad-exe/rea/pull/7) | 6          | Debugger types, server processes | not raised |

Stacked in that order; #4 is closed into #7. Squash #5 to #7 before raising them upstream (they carry the debugger removal and re-addition). None of #5 to #7 has had a Greptile or outside review. Run-time values stay unknown, so #3687 is not fully met.

## Planned or waiting

| Issue                                                                     | State                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| #3687 parts 4 to 6                                                        | Built in fork; raise after #14977 to #14979 merge             |
| [#2392](../blockchain-issues/plans/2392-storage-layout.md) storage layouts | Planned; waits for #12743; no comment posted                  |
| [#3672](../other-issues/3672-agent-protocols.md) agent protocols          | Noted to work on; not claimed; draft scope comment not posted |

## Places that will conflict

New tools edit the tool lists, CLI command files, the error observation union and both skill files. Expect a small resolution for whichever merges second.
