# Handoff for a new session

Written 2026-11-28. Read [our work](our-work.md) first, then verify live status with `gh` before acting.

## Next actions

1. Boxes are ticked on all seven (2026-11-28). Check the seven open upstream PRs for maintainer or bot comments; fix real findings until checks pass and Greptile shows 5/5.
2. Fixes to a lower stacked branch must be merged into the higher ones (#14951 → #14953; #14977 → #14978 → #14979 → fork debugger branch).
3. After a lower PR merges, merge `upstream/main` into the next branch and update its description.
4. Do not start new features until some reviews land, unless asked.
5. #3687: parts 4 to 6 wait in fork PRs #5 to #7. Next tier 1 work after #12743 merges: #2392, #2396, #2390.

Offered, not yet approved: add "please merge in order" to #14953, #14978 and #14979; try the Greptile CLI (user must install and log in).

## Standing rules from the owner

- Agreed parts are built completely, then reported; do not ask "continue?". One PR per part.
- PRs inside the fork open as ready. Ask before publishing upstream (PRs, comments).
- "Author readiness" boxes belong to the owner.
- No "Generated with Claude Code" line in PR descriptions.
- Reports in simple language, with tables.
- Do not spawn subagents unnecessarily.

## Where things are

| What                                  | Where                                                              |
| ------------------------------------- | ------------------------------------------------------------------ |
| Main checkout                         | `~/Codebase/Contribution/rea` (on `feat/solc-compiler-artifacts`)  |
| Feature work                          | worktree `~/Codebase/Contribution/rea-2393`; switch branches there |
| Notes, versioned on fork `main`       | worktree `~/Codebase/Contribution/rea/local-notes` (sparse)        |
| Issue pages and dashboard             | `local-notes/other-issues/`; dashboard in `local-notes/dashboard/`                                        |
| Learning pages, never committed       | `local-notes/learning/`                                            |
| Temporary check scripts and PR drafts | `~/temp/claude-1000/`; may be gone after a reboot                  |

PR branches start from `upstream/main`, never fork `main`. The fork `main` carries the notes and is behind upstream; sync by merging only when asked.

## Checks used before every push

`npm run check:fast`, `format:check`, `docs:check`, `verify:advertised-schemas -- --update-summary`, `knip`, and `test:focused` on the affected files. Prefix `PATH="/usr/local/bin:$PATH"`. Run `node scripts/generate-cursor-plugin-skill.mjs` after skill edits. The full suite was not run locally.

## Known limitations, stated in the PRs

- VS Code analysis misses registrations through helper functions or constant IDs; very large extensions (GitLens) come out `undetermined`.
- Proxy and VS Code PRs were checked on few real samples.

## Housekeeping

A copy of `3672-agent-protocols.md` sits at the root of `local-notes/`: the file had been moved out of `other-notes/` and a later commit recorded the removal. The tracked copy is restored; ask the owner before deleting the root copy.
