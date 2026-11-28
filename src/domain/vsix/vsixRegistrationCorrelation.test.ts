import { describe, expect, it } from "vitest";

import { graphForJavaScript } from "../../../tests/fixtures/javascriptSemanticGraph.js";
import { correlateVsixRegistrations } from "./vsixRegistrationCorrelation.js";

type ContributionKind =
  | "chat_participant"
  | "language_model_tool"
  | "mcp_server_provider"
  | "view"
  | "custom_editor"
  | "debugger";

const contributes = (
  commands: readonly string[],
  extra: {
    menus?: { menu: string; commands: (string | null)[] }[] | null;
    keybindings?: { command: string | null; key: string | null }[] | null;
    declarations?:
      | { kind: ContributionKind; id: string | null; label: string | null }[]
      | null;
  } = {},
) => ({
  commands: commands.map((command) => ({ command, title: null })),
  commands_omitted: 0,
  menus: [],
  keybindings: [],
  declarations: [],
  debug_adapters: null,
  ...extra,
});

const correlate = (
  source: string,
  declared: ReturnType<typeof contributes>,
  entryPoints: readonly string[] = ["app.js"],
) =>
  correlateVsixRegistrations({
    contributes: declared,
    entryPoints,
    manifestRead: true,
    semanticGraph: graphForJavaScript(source),
  });

const VSCODE = 'const vscode = require("vscode");\n';

describe("VS Code command correlation", () => {
  it("separates registered, missing and undeclared commands", () => {
    const result = correlate(
      `${VSCODE}vscode.commands.registerCommand("demo.a", f);
       vscode.commands.registerTextEditorCommand("demo.hidden", f);`,
      contributes(["demo.a", "demo.missing"]),
    );
    expect(
      result.commands.map(({ command, status }) => [command, status]),
    ).toEqual([
      ["demo.a", "registered"],
      ["demo.hidden", "registered_undeclared"],
      ["demo.missing", "not_found"],
    ]);
    expect(result.commands[0]?.registrations).toEqual([
      expect.objectContaining({
        function: "registerCommand",
        module_path: "app.js",
        line: 2,
        loader_authority: "candidate",
      }),
    ]);
    expect(result.summary).toEqual({
      declared: 2,
      registered: 1,
      not_found: 1,
      registered_undeclared: 1,
      undetermined: 0,
      unresolved_registrations: 0,
    });
  });

  it("keeps a built-at-run-time identifier unresolved", () => {
    const result = correlate(
      `${VSCODE}vscode.commands.registerCommand(prefix + ".a", f);`,
      contributes(["demo.a"]),
    );
    expect(result.commands[0]?.status).toBe("not_found");
    expect(result.unresolved_registrations).toHaveLength(1);
  });

  it("ignores same-named functions that are not from vscode", () => {
    const result = correlate(
      'const bus = require("bus"); bus.commands.registerCommand("demo.a", f);',
      contributes(["demo.a"]),
    );
    expect(result.commands[0]?.status).toBe("not_found");
    expect(result.unresolved_registrations).toEqual([]);
  });

  it("links menus and keybindings by command identifier", () => {
    const result = correlate(
      VSCODE,
      contributes(["demo.a"], {
        menus: [{ menu: "editor/context", commands: ["demo.a", null, "x"] }],
        keybindings: [{ command: "demo.a", key: "ctrl+h" }],
      }),
    );
    expect(result.menus).toEqual([
      { menu: "editor/context", commands: ["demo.a"] },
    ]);
    expect(result.commands[0]).toMatchObject({ keybindings: ["ctrl+h"] });
  });

  it("reports unread menus and keybindings as unknown", () => {
    const result = correlate(
      VSCODE,
      contributes(["demo.a"], { menus: null, keybindings: null }),
    );
    expect(result.menus).toBeNull();
    expect(result.commands[0]).toMatchObject({ keybindings: null });
  });

  it.each([
    ["extension/app.js", true],
    ["extension/other.js", false],
  ])("says whether the entry point %s was analyzed", (entry, analyzed) => {
    const result = correlate(VSCODE + "vscode.f();", contributes([]), [entry]);
    expect(result.entry_points).toEqual([{ path: entry, analyzed }]);
  });

  it("does not call a command missing when no entry point was analyzed", () => {
    const result = correlate(VSCODE, contributes(["demo.a"]), ["other.js"]);
    expect(result.commands[0]?.status).toBe("undetermined");
  });

  it("treats a file with omitted call analysis as not analyzed", () => {
    const graph = graphForJavaScript(VSCODE + "vscode.f();");
    const omitted = {
      ...graph,
      coverage: { ...graph.coverage, truncated: true },
      unknowns: [
        {
          family: "call-flow",
          reason: "resource-limit",
          evidence: {
            location: {
              available: true,
              value: { kind: "artifact-path", path: "app.js" },
            },
          },
        },
      ],
    } as unknown as typeof graph;
    const result = correlateVsixRegistrations({
      contributes: contributes(["demo.a"]),
      entryPoints: ["app.js"],
      manifestRead: true,
      semanticGraph: omitted,
    });
    expect(result.entry_points).toEqual([{ path: "app.js", analyzed: false }]);
    expect(result.commands[0]?.status).toBe("undetermined");
    expect(result.summary).toMatchObject({ not_found: 0, undetermined: 1 });
  });

  it("correlates chat participants, tools and MCP providers", () => {
    const result = correlate(
      `${VSCODE}vscode.chat.createChatParticipant("demo.chat", f);
       vscode.lm.registerTool("demo_hidden", t);
       vscode.lm.registerMcpServerDefinitionProvider(id, p);`,
      contributes([], {
        declarations: [
          { kind: "chat_participant", id: "demo.chat", label: "demo" },
          { kind: "language_model_tool", id: "demo_tool", label: null },
        ],
      }),
    );
    expect(
      result.contributions.map(({ kind, id, status }) => [kind, id, status]),
    ).toEqual([
      ["chat_participant", "demo.chat", "registered"],
      ["language_model_tool", "demo_hidden", "registered_undeclared"],
      ["language_model_tool", "demo_tool", "not_found"],
    ]);
    expect(result.unresolved_registrations).toEqual([
      expect.objectContaining({
        function: "registerMcpServerDefinitionProvider",
      }),
    ]);
    expect(result.commands).toEqual([]);
  });

  it("does not call a registration undeclared when declarations are unread", () => {
    const result = correlate(
      `${VSCODE}vscode.lm.registerTool("demo_tool", t);`,
      contributes([], { declarations: null }),
    );
    expect(result.contributions[0]?.status).toBe("undetermined");
  });

  it("correlates views and custom editors with their providers", () => {
    const result = correlate(
      `${VSCODE}vscode.window.registerTreeDataProvider("demo.tree", p);
       vscode.window.createTreeView("demo.tree", o);
       vscode.window.registerWebviewViewProvider("demo.web", p);
       vscode.window.registerCustomEditorProvider("demo.editor", p);`,
      contributes([], {
        declarations: [
          { kind: "view", id: "demo.tree", label: "Tree" },
          { kind: "view", id: "demo.web", label: null },
          { kind: "custom_editor", id: "demo.other", label: null },
        ],
      }),
    );
    expect(
      result.contributions.map(({ id, status, registrations }) => [
        id,
        status,
        registrations.length,
      ]),
    ).toEqual([
      ["demo.tree", "registered", 2],
      ["demo.web", "registered", 1],
      ["demo.editor", "registered_undeclared", 1],
      ["demo.other", "not_found", 0],
    ]);
  });

  it("correlates debugger types with adapter and configuration providers", () => {
    const result = correlate(
      `${VSCODE}vscode.debug.registerDebugAdapterDescriptorFactory("demo-debug", f);
       vscode.debug.registerDebugConfigurationProvider("demo-debug", p);`,
      contributes([], {
        declarations: [
          { kind: "debugger", id: "demo-debug", label: "Demo" },
          { kind: "debugger", id: "other-debug", label: null },
        ],
      }),
    );
    expect(
      result.contributions.map(({ id, status, registrations }) => [
        id,
        status,
        registrations.length,
      ]),
    ).toEqual([
      ["demo-debug", "registered", 2],
      ["other-debug", "not_found", 0],
    ]);
  });

  const withGraph = (
    change: (graph: ReturnType<typeof graphForJavaScript>) => unknown,
  ) =>
    correlateVsixRegistrations({
      contributes: contributes(["demo.a"]),
      entryPoints: ["app.js"],
      manifestRead: true,
      semanticGraph: change(
        graphForJavaScript(VSCODE + "vscode.f();"),
      ) as ReturnType<typeof graphForJavaScript>,
    });

  it("makes no absence claim from a graph without callee facts", () => {
    const result = withGraph(({ callee_fact_modules: _, ...graph }) => graph);
    expect(result.commands[0]?.status).toBe("undetermined");
  });

  it("treats a skipped file as not analyzed", () => {
    const result = withGraph((graph) => ({
      ...graph,
      unknowns: [
        {
          family: "call-flow",
          reason: "incomplete-module",
          evidence: {
            location: {
              available: true,
              value: { kind: "artifact-path", path: "app.js" },
            },
          },
        },
      ],
    }));
    expect(result.entry_points).toEqual([{ path: "app.js", analyzed: false }]);
    expect(result.commands[0]?.status).toBe("undetermined");
  });

  it.each([
    ["omitted commands", { commands_omitted: 3 }, true],
    ["an unread manifest", {}, false],
  ])("does not call a command undeclared with %s", (_, extra, manifestRead) => {
    const result = correlateVsixRegistrations({
      contributes: { ...contributes([]), ...extra },
      entryPoints: ["app.js"],
      manifestRead,
      semanticGraph: graphForJavaScript(
        `${VSCODE}vscode.commands.registerCommand("demo.a", f);`,
      ),
    });
    expect(result.commands[0]?.status).toBe("undetermined");
  });
});

describe("VS Code webview facts", () => {
  const webviewsOf = (source: string) =>
    correlate(source, contributes([])).webviews;

  it("pairs message types sent and handled on both sides", () => {
    const webviews = webviewsOf(
      `${VSCODE}const panel = vscode.window.createWebviewPanel("demo.panel", "T", 1);
       panel.webview.postMessage({ type: "load" });
       panel.webview.onDidReceiveMessage((message) => {
         switch (message.command) { case "save": break; case "lost": break; }
       });
       const api = acquireVsCodeApi();
       api.postMessage({ command: "save" });
       api.postMessage({ command: "extra" });
       window.addEventListener("message", (event) => {
         const data = event.data;
         if (data.type === "load") render();
       });`,
    );
    expect(webviews?.panels.map(({ view_type }) => view_type)).toEqual([
      "demo.panel",
    ]);
    expect(webviews?.messages).toEqual([
      { direction: "to_extension", type: "extra", status: "sent_only" },
      { direction: "to_extension", type: "lost", status: "handled_only" },
      { direction: "to_extension", type: "save", status: "paired" },
      { direction: "to_webview", type: "load", status: "paired" },
    ]);
    expect(webviews?.sends.map(({ line }) => line)).toEqual([3, 8, 9]);
    expect(webviews?.receivers.map(({ line, types }) => [line, types])).toEqual(
      [
        [4, ["lost", "save"]],
        [10, ["load"]],
      ],
    );
    expect(webviews?.api_acquisitions).toHaveLength(1);
  });

  it("reads named and destructuring handlers, and marks others unknown", () => {
    const webviews = webviewsOf(
      `function receive({ type }) { if ("a" === type) go(); }
       window.addEventListener("message", (e) => { switch (e.data.method) { case "update": break; } });
       view.webview.onDidReceiveMessage(receive);
       this.view.webview.onDidReceiveMessage(this.receive);
       const { webview } = view; webview?.postMessage(payload);`,
    );
    expect(webviews?.receivers.map(({ types }) => types)).toEqual([
      ["update"],
      ["a"],
      null,
    ]);
    expect(webviews?.sends).toEqual([
      expect.objectContaining({ direction: "to_webview", type: null }),
    ]);
  });

  it("keeps fixed HTML text and leaves built HTML unknown", () => {
    const webviews = webviewsOf(
      `a.webview.html = "<h1>a</h1>";
       b.webview.html = \`<p>b</p>\`;
       c.webview.html = render();`,
    );
    expect(webviews?.html.map(({ html }) => html)).toEqual([
      "<h1>a</h1>",
      "<p>b</p>",
      null,
    ]);
  });

  it("ignores other receivers and a locally defined acquireVsCodeApi", () => {
    const webviews = webviewsOf(
      `worker.postMessage({ type: "a" }); bus.onDidReceiveMessage(f);
       page.html = "x"; function acquireVsCodeApi() {} acquireVsCodeApi();`,
    );
    expect(webviews).toMatchObject({
      sends: [],
      receivers: [],
      html: [],
      api_acquisitions: [],
      messages: [],
    });
  });

  it("reports unrecorded facts as unknown for an older graph", () => {
    const { extension_facts, ...older } = graphForJavaScript(
      "view.webview.postMessage(1);",
    );
    expect(extension_facts).toBe(true);
    expect(
      correlateVsixRegistrations({
        contributes: contributes([]),
        entryPoints: ["app.js"],
        manifestRead: true,
        semanticGraph: older,
      }).webviews,
    ).toBeNull();
  });
});

describe("VS Code server processes", () => {
  const processesOf = (source: string) =>
    correlate(source, contributes([])).processes;

  it("lists spawns and debug adapter descriptors with fixed values", () => {
    const processes = processesOf(
      `${VSCODE}const cp = require("child_process");
       cp.spawn("gopls", ["serve"]);
       cp.exec(command);
       new vscode.DebugAdapterExecutable("node", ["adapter.js"]);
       new vscode.DebugAdapterServer(4711);
       new vscode.DebugAdapterInlineImplementation(session);`,
    );
    expect(
      processes.spawns.map(({ method, command }) => [method, command]),
    ).toEqual([
      ["spawn", "gopls"],
      ["exec", null],
    ]);
    expect(
      processes.debug_adapters.map(({ descriptor, target }) => [
        descriptor,
        target,
      ]),
    ).toEqual([
      ["DebugAdapterExecutable", "node"],
      ["DebugAdapterServer", 4711],
      ["DebugAdapterInlineImplementation", null],
    ]);
  });

  it("reads language client server options and keeps built ones unknown", () => {
    const processes = processesOf(
      `${VSCODE}const { LanguageClient } = require("vscode-languageclient/node");
       const path = require("path");
       exports.activate = (context) => {
         const module = context.asAbsolutePath(path.join("server", "out", "main.js"));
         const options = { run: { module }, debug: { module, transport: 1 } };
         new LanguageClient("demo", "Demo", options, {});
         new lsp.LanguageClient("Other", { command: "rust-analyzer" }, {});
         new LanguageClient("dyn", "Dyn", () => start(), {});
       };`,
    );
    expect(
      processes.language_clients?.map(({ id, servers }) => [id, servers]),
    ).toEqual([
      [
        "demo",
        [
          { mode: "run", command: null, module: "server/out/main.js" },
          { mode: "debug", command: null, module: "server/out/main.js" },
        ],
      ],
      ["Other", [{ mode: null, command: "rust-analyzer", module: null }]],
      ["dyn", null],
    ]);
  });

  it("includes subclasses of a language client", () => {
    const processes = processesOf(
      `var Expr = class extends lsp.LanguageClient {};
       class Declared extends LanguageClient {}
       class Other extends Client {}
       new Expr("A", { command: "a" }, {});
       new Declared("B", { command: "b" }, {});
       new Other("C", { command: "c" }, {});`,
    );
    expect(processes.language_clients?.map(({ id }) => id)).toEqual(["A", "B"]);
  });

  it("reports unrecorded language client facts as unknown", () => {
    const { extension_facts, ...older } = graphForJavaScript("f();");
    expect(extension_facts).toBe(true);
    expect(
      correlateVsixRegistrations({
        contributes: contributes([]),
        entryPoints: ["app.js"],
        manifestRead: true,
        semanticGraph: older,
      }).processes,
    ).toMatchObject({ language_clients: null, declared_debug_adapters: null });
  });
});

it("is undetermined when a call's literal identifier exceeded a limit", () => {
  const result = correlate(
    `${VSCODE}vscode.commands.registerCommand("${"x".repeat(2_000_000)}", f);`,
    contributes(["demo.a"]),
  );
  expect(result.commands.map(({ status }) => status)).toEqual(["undetermined"]);
});
