# VS Code extension packages

`inspect_vsix_package` / `inspect-vsix-package` reads one selected local
`.vsix` as a ZIP and reports package identity from `extension.vsixmanifest`
and `extension/package.json`, activation events, a contributes summary, and a
contents inventory. It does not install the extension, execute anything in it,
or contact a marketplace.

```bash
rea inspect-vsix-package /absolute/path/to/demo.hello-1.2.3.vsix --json
```

With `--detail summary --evidence_output /absolute/path/vsix.json`, the CLI
saves the complete Evidence as a new bundle and prints a summary view with
identity, engine, target platform, entry points, signature presence, coverage,
and counts of activation events, commands, contents, interesting members and
limitations.

The CLI resolves relative paths against the caller's working directory. MCP
requires an absolute filesystem path and preserves that exact selection:

```json
{
  "name": "inspect_vsix_package",
  "arguments": { "path": "/artifacts/demo.hello-1.2.3.vsix" }
}
```

## Installed extension folders

`path` can also name an installed extension folder, such as
`~/.vscode/extensions/publisher.name-1.2.3`. Pass the same folder to
`analyze_javascript_application` to correlate its registrations.

- The folder's files are reported under `extension/`, and its `.vsixmanifest`
  as `extension.vsixmanifest`, so the report reads like a package report.
- `artifact.sha256` is the folder's complete directory tree digest and
  `artifact.tree` names the algorithm. `artifact.bytes` totals the file bytes.
- `max_file_bytes` limits those total bytes and `max_entries` limits files,
  directories and links together. Installed folders with `node_modules` often
  need higher values than the defaults.
- Symbolic links are never followed; each is named in a limitation. An entry
  that cannot be examined, such as a FIFO or a name that is not UTF-8, fails
  the call because the folder then has no complete identity.
- VS Code may add metadata to an installed `package.json`, so the folder can
  differ from the package it came from.

## Observations

The inline Evidence result contains the artifact path, SHA-256, and byte length.

`vsix_identity` reports `id`, `version`, `publisher`, `target_platform`,
`display_name`, and `description` as present in `extension.vsixmanifest`.
The display name and description are reported even when the manifest omits
its `Identity` element.
`package_identity` reports `name`, `publisher`, and `version` as present in
`extension/package.json`. Missing fields are `null`. When a unique
vsixmanifest or package.json cannot be selected, that identity is `null`.
`identity_disagreements` lists fields whose values differ between the two
manifests.

`engine` reports the `Microsoft.VisualStudio.Code.Engine` property and
`engines.vscode` range, with `disagreement` when both are present and differ.
`target_platform` is the vsixmanifest Identity `TargetPlatform`.
`entry_points.main` and `entry_points.browser` are the package.json paths
resolved under `extension/`, each with `present` true when that ZIP member
exists.

`activation_events` lists each package.json event with `eager` true for `*`
and `onStartupFinished`. `contributes` lists contribute key names and counts,
every declared command, the commands each menu invokes (`menus`), and the command each
keybinding (`keybindings`) invokes, plus declared chat participants, language
model tools, MCP server providers, views, custom editors and debugger types (`declarations`),
and configuration `settings`. `extension_dependencies` and `extension_pack` keep both
manifests' declared ids and a `disagreement` flag. A side is `null` when its
manifest was missing or could not be read, and `disagreement` is only true
when both sides were read. `extension_kind`,
`capabilities.untrusted_workspaces` / `virtual_workspaces`, and
`enabled_api_proposals` come from package.json when present.
`assets` lists vsixmanifest Asset Type/Path pairs and whether each path is
present in the ZIP.

`signatures.p7s` and `signatures.manifest` are true when
`extension.signature.p7s` or `.signature.manifest` is present. Presence is
not verification.

`contents` lists file ZIP members with the stored ZIP `name`, a logical
`path` (backslashes as `/`, leading `./` removed), uncompressed and compressed
sizes, an `encrypted` flag, a path-derived `kind`, and `traverses`. Directory
markers are omitted. Encrypted members are listed and not extracted.
`interesting_members` lists native addons, wasm modules, executables, shell
scripts, and nested archives with byte length, SHA-256 when hashed, and
`classification` `observed` (magic bytes) or `inferred` (name or Unix
executable bit). Member kinds are ZIP-name and magic conventions, not a
runtime load inventory.

## Commands and their handlers

`correlate_vsix_registrations` (CLI `correlate-vsix-registrations`) joins the declared
commands to `vscode.commands.registerCommand` and
`registerTextEditorCommand` calls. It needs two complete Evidence records:
`inspect_vsix_package` for the package and `analyze_javascript_application`
for the files extracted from it.

```bash
rea extract-artifact demo.vsix --output-root /absolute/extracted
rea inspect-vsix-package demo.vsix --detail complete --json > package.json
rea analyze-javascript-application /absolute/extracted/extension --detail complete --json > application.json
```

Pass both records as `vsix_package` and `javascript_application` in one JSON
document to `rea correlate-vsix-registrations request.json --json`. MCP also accepts
exact retained-Evidence references.

| `status`                | Meaning                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `registered`            | A call with that literal identifier was found                                       |
| `not_found`             | Declared, and no such call was seen                                                 |
| `undetermined`          | No call seen, but a declared entry point was not analyzed or analysis was truncated |
| `registered_undeclared` | Registered in code, absent from `contributes.commands`                              |

Each registration has its module, line and column. `loader_authority:
candidate` marks a `require`-based match, and `wrapper: unverified` one that
reaches `vscode` through an interop helper such as `__toESM` whose effect is not
checked. Calls whose identifier is not a string literal appear in
`unresolved_registrations`. `menus` lists the known commands each menu invokes, and each command's
`keybindings` lists its keys; both are null when not recorded.

When the result is larger than the agent result budget, MCP returns a retained
summary of counts; page the complete record with `inspect_analysis_view` kind
`evidence-json`, or request `detail: "complete"`.

REA does not verify that the two records describe the same files:
`entry_points` says whether each declared entry path was analyzed. `not_found`
does not prove that a command has no handler.

`contributions` reports the same statuses for these contribution points:

| Declared in `contributes`           | Registered with                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `chatParticipants[].id`             | `vscode.chat.createChatParticipant`                                                          |
| `languageModelTools[].name`         | `vscode.lm.registerTool`                                                                     |
| `mcpServerDefinitionProviders[].id` | `vscode.lm.registerMcpServerDefinitionProvider`                                              |
| `views.*[].id`                      | `vscode.window.registerTreeDataProvider`, `createTreeView` or `registerWebviewViewProvider`  |
| `customEditors[].viewType`          | `vscode.window.registerCustomEditorProvider`                                                 |
| `debuggers[].type`                  | `vscode.debug.registerDebugAdapterDescriptorFactory` or `registerDebugConfigurationProvider` |

The servers an MCP provider returns at run time, their commands and prompt
handling are not analyzed. `summary` counts commands only, apart from
`unresolved_registrations`, which covers every kind.

The package report also lists declared configuration `settings` with their
types. Reads of those settings in code are not correlated. Views that VS Code
fills without a provider call, such as walkthrough or welcome content, have no
registration to find.

A debugger declared with only a static `program` needs no registration call and
can appear as `not_found`. Debug adapter and language server processes are not
analyzed.

`undetermined` also replaces `registered_undeclared` when the manifest was not
read or an older record omitted commands. Absence is not claimed when any source
was skipped or unparsed, or for application Evidence recorded before callee
facts existed; rerun the analysis for those.

## Webviews

`webviews` reports how the extension and its webviews talk. It is `null` for
application Evidence recorded before these facts existed.

| Field              | Content                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `panels`           | `vscode.window.createWebviewPanel` calls with a literal `view_type`        |
| `sends`            | `*.webview.postMessage`, or `postMessage` on the `acquireVsCodeApi` object |
| `receivers`        | `*.webview.onDidReceiveMessage` and `window` `message` listeners           |
| `messages`         | Each message type per direction: `paired`, `sent_only` or `handled_only`   |
| `html`             | Assignments to `*.webview.html`, with the text when written as fixed text  |
| `api_acquisitions` | Calls to the global `acquireVsCodeApi`                                     |

A message type is the literal `type`, `command` or `method` property of a sent
object. A
receiver's `types` are the literals its handler compares those properties with,
by `===`, `==` or `switch`; it is `null` when the handler is not a function in
the same file, such as `this.receive`.

Webview views and custom editors appear in `contributions`. Recognition is by
name, so a renamed receiver is missed and an unrelated object with the same name
can appear. Messages are paired across all webviews. Run-time message types,
scripts inside `.html` files and HTML built at run time are not read, so
`sent_only`, `handled_only` or an empty list does not prove that nothing is on
the other side. `omitted_facts` counts facts over the per-file record size. HTML
files shipped in the package are listed in the package report's `contents`;
`extract-artifact` unpacks them.

## Language and debug servers

`processes` lists where the extension declares or starts other programs.

| Field                     | Content                                                                        |
| ------------------------- | ------------------------------------------------------------------------------ |
| `declared_debug_adapters` | `program` and `runtime` of each `contributes.debuggers` row                    |
| `spawns`                  | `spawn`, `exec`, `execFile` and `fork` from `child_process`                    |
| `debug_adapters`          | `vscode.DebugAdapter*` descriptors with a literal command, port or pipe        |
| `language_clients`        | `new LanguageClient(...)` with the `command` or `module` of its server options |

A server option path is read from fixed text, including `asAbsolutePath` and
`join` of fixed text. Option functions, run-time values and options built in
another file are `null`. `LanguageClient` and local subclasses of it are
matched by class name, since extensions usually bundle the library. Platform-specific manifest overrides are
not read, and no process is started or observed. `spawns` and `debug_adapters`
come from call analysis, so a truncated graph can omit them. Native and
WebAssembly files are listed in the package report's `interesting_members`.

## Limits and failures

The selected file is limited to 64 MiB by default (512 MiB maximum). At most
4096 ZIP entries are inventoried by default (65536 maximum). Each of
`extension.vsixmanifest` and `extension/package.json` is limited to 1 MiB by
default (16 MiB maximum); exceeding that budget fails without partial success.
Interesting members are hashed up to 1 MiB by default (16 MiB maximum);
exceeding that budget lists the member without a digest. Invalid ZIP input
fails without a partial inventory.

Missing, malformed, path-traversal, or duplicate-name members succeed with
the ZIP inventory and explicit limitations. A vsixmanifest DOCTYPE is
unsupported. This workflow does not install extensions, verify signatures, or
execute bundled code. Package identity and contributes metadata are
publisher-provided and do not establish extension safety.

Evidence parameters retain only caller-selected controls; execution resolves omitted budgets from the documented defaults.
