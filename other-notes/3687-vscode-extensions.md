# #3687 VS Code extension analysis

[Issue](https://github.com/morluto/rea/issues/3687) · [Our work](our-work.md). Updated 2026-11-28. Status: **in progress** on branch `feat/vsix-command-handlers` (from upstream `c24ec44c9`).

## State

[#12469](https://github.com/morluto/rea/pull/12469) (mvanhorn, merged) calls itself the first slice. Later VSIX fixes were merged. The issue had no assignee or comments, and a search found no open PR.

| Requirement                              | Status                                                         |
| ---------------------------------------- | -------------------------------------------------------------- |
| Read `.vsix` packages                    | Done (`inspect_vsix_package`; `extract-artifact` unpacks them) |
| Read installed extension folders         | Missing                                                        |
| Map contribution points to handlers      | Missing; only keys, counts and commands                        |
| Webview messaging and content            | Missing                                                        |
| Native and WebAssembly members           | Listed with digests by design; not exercised in our sample     |
| Language and debug server processes      | Missing                                                        |
| Chat participants, AI tools, MCP servers | Missing; contribution counts only                              |

A synthetic sample showed that `analyze-javascript-application` on the extracted folder records the `vscode.*` calls and some literal arguments, without VS Code meaning.

## Reply (2026-11-28)

mvanhorn is not working on this part and said to take it: command correlation sounds right, dynamically built names should stay unresolved, and the declared command list from #12469 should be built on instead of reparsing `package.json`. Final scope is morluto's call; no reply from morluto yet.

## Chosen design: A

The JavaScript analysis learns VS Code command registrations, beside its Electron IPC recognition. Chosen by the human owner over a separate reader or position matching.

Findings that shaped it:

- In the sample, the analysis result recorded the literal argument and the `registerCommand` property use, with no direct link from the call to that member.
- The VSIX report lists at most 32 commands (`VSIX_COMMANDS_CAP`). The full list must be kept; summaries may stay capped.

## All parts of #3687

| Part | Content                                              | State           |
| ---- | ---------------------------------------------------- | --------------- |
| 0    | Package inspection, native and WebAssembly members   | Merged (#12469) |
| 1    | Commands, menus and keybindings to handlers          | **In progress** |
| 2    | Chat participants, language model tools, MCP servers | Not started     |
| 3    | Detailed views, settings and other contributions     | Not started     |
| 4    | Installed extension folders                          | Not started     |
| 5    | Webview content and messaging                        | Not started     |
| 6    | Language and debug server processes                  | Not started     |

Six parts remain, including this one. The split is ours, not the issue's. This PR uses `Refs #3687`.

## Part 1 steps

1. Recognize `registerCommand` and `registerTextEditorCommand` bound to `vscode`, including CommonJS, ES imports, destructuring and bundler wrappers; dynamic IDs unresolved.
2. Try it on bundled, minified and real extensions.
3. Keep the full declared command list in the VSIX report.
4. New correlation result: registered, not found, registered but undeclared; menus and keybindings by command ID.
5. Docs, schema records, tests, checks.

## Progress (2026-11-28)

Uncommitted on `feat/vsix-command-handlers` in the `rea-2393` worktree.

- Done: call sites record their callee access path; `javascriptSemanticModuleCallee.ts` resolves it to a module member from the binding's origin. 15 tests pass (require, ES imports, destructuring, alias, sequence and optional calls; shadowed, reassigned and computed forms stay unresolved).
- Resolved in a trial: plain `require`, `registerTextEditorCommand`.
- Not resolved in a trial with simplified stand-ins: esbuild `__toESM`, TypeScript `__importStar`, a webpack module map.
- Next: reuse the existing module interop owner (`createSemanticModuleInterop`, used for Electron) with real compiler output; then graph property, full command list, correlation result.

### Real compiler output (2026-11-28)

Decision: one PR per part.

| Output of                    | Named import | Namespace or default import                      |
| ---------------------------- | ------------ | ------------------------------------------------ |
| esbuild (plain and minified) | resolved     | not resolved                                     |
| rolldown                     | resolved     | not resolved                                     |
| TypeScript `tsc`             | resolved     | not resolved (`__importStar`, `__importDefault`) |

webpack was tried only with a hand-written stand-in. Namespace imports wrap `require("vscode")` in a helper. The interop owner (`javascriptModuleInterop.ts`) proves only the Rolldown helper shape, and the new resolver does not use it yet.

Open decision: extend that proof per compiler helper, or label any `helper(require("vscode"))` binding as a candidate.

## Decisions and progress (latest)

- One PR per part; part 1 stays a single PR (human owner).
- Option B for wrappers: `helper(require(name))` is reported with `loader_authority: candidate` and `wrapper: unverified`.
- Done: resolver, including wrappers; call-site graph nodes carry `module_callee` for `vscode` only. All 12 real outputs resolved (esbuild plain and minified, rolldown, tsc; namespace, default and named imports). webpack real output untested.
- Checks: `check:fast`; 112 semantic and graph test files, 3833 tests. Uncommitted.
- Remaining: full declared command list in the VSIX report; correlation operation with CLI and MCP; docs, schema records, boundary tests; a real extension trial.

- Done: the VSIX report keeps every declared command (`commands_omitted` is now always 0) and records `menus` and `keybindings` (null when `package.json` was not read or in older Evidence). 110 VSIX tests, `check:fast`, `docs:check` passed. Uncommitted.
- Next: the correlation operation (domain result, CLI, MCP, docs, boundary tests), then a real extension trial.

## Part 1 complete locally (2026-11-28)

Uncommitted on `feat/vsix-command-handlers`. Adds `correlate_vsix_commands` (CLI and MCP) over package and application Evidence.

Real extensions from Open VSX, analyzed statically:

| Extension              | Declared | Registered | Undeclared | Undetermined |
| ---------------------- | -------- | ---------- | ---------- | ------------ |
| EditorConfig 0.18.2    | 1        | 1          | 1          | 0            |
| prettier-vscode 12.4.0 | 2        | 2          | 1          | 0            |
| GitLens 2026.11.260409 | 1199     | 0          | 0          | 1199         |

GitLens: call analysis of both entry bundles was dropped under the analysis result budget, so every command is undetermined. The first run reported them all as not found; fixed. Its code also registers through local wrapper functions, so literal matching would miss many even with a larger budget (seen in the source, not measured).

Checks: `check:fast`, `format:check`, `docs:check`, schema summary; 140 selected test files, 4327 tests. Next: human review, commit, PR with `Refs #3687`.

## Fork pull requests (2026-11-28)

| Part | Fork PR                                                      | Base              | Content                                                    |
| ---- | ------------------------------------------------------------ | ----------------- | ---------------------------------------------------------- |
| 1    | [akshad-exe/rea#1](https://github.com/akshad-exe/rea/pull/1) | `base/vsix-part1` | Commands; operation renamed `correlate_vsix_registrations` |
| 2    | [akshad-exe/rea#2](https://github.com/akshad-exe/rea/pull/2) | part 1 branch     | Chat participants, tools, MCP providers                    |

Nothing opened upstream. Part 2 real trials: three extensions matched; flowrelay's chat participant and MCP provider were missed (APIs obtained through helper functions, IDs as constants). Still open in part 2's area: prompt handling, run-time MCP server definitions.

Remaining parts: 3 detailed contributions, 4 installed folders, 5 webviews, 6 language and debug servers.

### Part 3

[akshad-exe/rea#3](https://github.com/akshad-exe/rea/pull/3), on the part 2 branch. Views and custom editors correlated; settings listed. Part 2 fields renamed to `contributions` and `contributes.declarations`. Real trials: views registered in two extensions, one undetermined; custom editors only unit tested.

Not covered by parts 1 to 3: setting reads, languages, debuggers, other contribution points. Remaining: 4 installed folders, 5 webview messaging, 6 language and debug servers.

### Debuggers (slice of part 6)

[akshad-exe/rea#4](https://github.com/akshad-exe/rea/pull/4), on the part 3 branch. Unit tested only.

## What still blocks closing #3687

| Item                                                 | Needs                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Installed extension folders (part 4)                 | A directory reader for the package report with its own symlink and size rules; the current reader is ZIP only |
| Webview content and messaging (part 5)               | New analysis of webview objects, which are not `vscode` module calls; HTML is often built at run time         |
| Language and debug server processes (rest of part 6) | Recovering `LanguageClient` options and spawned commands, usually inside bundled libraries                    |
| Registrations through helpers and constant IDs       | Value tracing in the analyzer (seen missed in flowrelay and agent-kanban)                                     |
| Large extensions                                     | The analysis result budget drops call analysis (GitLens)                                                      |

The criterion "map 100% of declared contribution points to handlers" cannot be met by static analysis; agree the scope with morluto before any PR says `Fixes`.
