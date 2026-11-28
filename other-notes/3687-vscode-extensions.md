# #3687 VS Code extension analysis

[Issue](https://github.com/morluto/rea/issues/3687). Checked 2026-11-28 against upstream `a91d9fa2b`. Status: planned, not started. [Comment posted](https://github.com/morluto/rea/issues/3687#issuecomment-7233182377) 2026-11-28; waiting for a reply.

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

## First slice: commands to handlers

Question: for each declared command, where is it registered, and which declarations or registrations are unmatched?

| Result per command      | Meaning                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `registered`            | A `registerCommand` or `registerTextEditorCommand` call with that literal ID, with module and source range |
| `not_found`             | No literal registration was seen; this does not show there is none                                         |
| `registered_undeclared` | Registered in code but absent from `contributes.commands`                                                  |

Menus and keybindings link to commands by ID. Computed IDs stay unresolved and are counted.

## Where to look

- Manifest facts: `src/vsix/VsixPackageParser.ts`, `src/domain/vsix/vsixPackage.ts`
- Call facts: the JavaScript semantic graph (`literal_argument_value` and call arguments)
- Reuse both owners; do not parse the archive or the JavaScript a second time.

## Open questions

- A new operation that takes retained JavaScript analysis Evidence, or an extension of the VSIX tool? Read "Decide whether to add a tool" and "Compose declared Evidence inputs" in `docs/development/tool-design.md` first.
- How reliably does the graph resolve `vscode` through bundlers and minification? Test on real extensions before designing.
- Does mvanhorn plan the next slice?

## Later slices

Chat participants, tools and MCP declarations; detailed contributions; installed folders; webviews and language servers.

## Before code

- [#14951](https://github.com/morluto/rea/pull/14951) finished first.
- Wait a short while for mvanhorn or a maintainer to reply to the comment.
- Branch from `upstream/main`. No spec or plan files in the PR.

## Comment draft (a shorter version was posted)

> @mvanhorn @morluto #12469 delivered package inspection as the first slice. Are you planning the next one? If not, I'd like to link declared commands (with their menus and keybindings) to `registerCommand` calls found by the existing JavaScript analysis: each command reported as registered with its source location, not found, or registered but undeclared. Static only, no extension execution. Computed command IDs would stay explicitly unresolved.
