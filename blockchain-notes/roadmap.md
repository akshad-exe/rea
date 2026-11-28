# Tier 1 roadmap

[Master tracker](README.md). Issue claims and PRs checked 2026-11-28; recheck before starting any item.

At that date, no open tier 1 issue other than #2389 had an assignee, claim or open PR.

## Path

| Step | Issue                                                                                                                        | Starts when                                                                                                                                                      | Plan                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 0    | [#2389](https://github.com/morluto/rea/issues/2389) compiler artifacts ([#12743](https://github.com/morluto/rea/pull/12743)) | In review                                                                                                                                                        | -                                    |
| 1    | [#2393](https://github.com/morluto/rea/issues/2393) proxy evidence                                                           | [#14951](https://github.com/morluto/rea/pull/14951) in review; [second PR](plans/2393-second-pr.md) [#14953](https://github.com/morluto/rea/pull/14953) in draft | [plan](plans/2393-proxy-evidence.md) |
| 2    | [#2392](https://github.com/morluto/rea/issues/2392) storage layouts                                                          | #12743 merged                                                                                                                                                    | [plan](plans/2392-storage-layout.md) |
| 3    | [#2391](https://github.com/morluto/rea/issues/2391) ABI decoding                                                             | A hashing library is chosen                                                                                                                                      | to write                             |
| 4    | [#2396](https://github.com/morluto/rea/issues/2396) bytecode comparison                                                      | #12743 merged                                                                                                                                                    | to write                             |
| 5    | [#2390](https://github.com/morluto/rea/issues/2390) source maps                                                              | #12743 merged                                                                                                                                                    | to write                             |
| 6    | [#2394](https://github.com/morluto/rea/issues/2394) recorded traces                                                          | #2390 done, real captures available                                                                                                                              | to write                             |

## Parked

| Issue                                                                                                                                           | Why                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [#2395](https://github.com/morluto/rea/issues/2395) disassembly and CFG                                                                         | Design issue; needs an engine choice and likely a maintainer decision                                             |
| [#3736](https://github.com/morluto/rea/issues/3736) decompiler                                                                                  | Needs #2395; overlaps #3716                                                                                       |
| [#3734](https://github.com/morluto/rea/issues/3734) deployment lineage, [#3733](https://github.com/morluto/rea/issues/3733) account abstraction | Very broad; split first                                                                                           |
| [#2388](https://github.com/morluto/rea/issues/2388) metadata                                                                                    | Remaining part in [#14967](https://github.com/morluto/rea/pull/14967); see [our work](../other-notes/our-work.md) |

## Rules for every step

- Recheck the issue and open PRs first.
- Branch from `upstream/main`, never from the fork's `main` (it carries these notes).
- No new provider, execution or network access without a maintainer decision.
- Do not commit specs or plans in a PR; describe the design in the PR text.
- Commit and push only after review.
