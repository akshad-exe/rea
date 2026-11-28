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
