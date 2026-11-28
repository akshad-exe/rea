import { z } from "zod";

import { evidenceInputSchema } from "../evidenceReference.js";
import { JAVASCRIPT_WEBVIEW_DIRECTIONS } from "../javascript/javascriptSemanticIr.js";
import type { JavaScriptSemanticGraph } from "../javascript/javascriptSemanticGraph.js";
import { compareUnicodeCodePoints } from "../unicodeCodePointOrder.js";
import { VSIX_CONTRIBUTION_KINDS, type VsixPackage } from "./vsixPackage.js";

/** Inline or exact retained Evidence for both sides of the correlation. */
export const correlateVsixRegistrationsInputSchema = z.strictObject({
  vsix_package: evidenceInputSchema.describe(
    "Complete inspect_vsix_package Evidence",
  ),
  javascript_application: evidenceInputSchema.describe(
    "Complete analyze_javascript_application Evidence for the same extension's extracted files",
  ),
});

/** The vscode functions that register each kind of contribution. */
const REGISTRATION_KINDS = {
  "commands.registerCommand": "command",
  "commands.registerTextEditorCommand": "command",
  "chat.createChatParticipant": "chat_participant",
  "lm.registerTool": "language_model_tool",
  "lm.registerMcpServerDefinitionProvider": "mcp_server_provider",
  "window.registerTreeDataProvider": "view",
  "window.createTreeView": "view",
  "window.registerWebviewViewProvider": "view",
  "window.registerCustomEditorProvider": "custom_editor",
  "debug.registerDebugAdapterDescriptorFactory": "debugger",
  "debug.registerDebugConfigurationProvider": "debugger",
} as const;
const REGISTRATIONS = [
  "registerCommand",
  "registerTextEditorCommand",
  "createChatParticipant",
  "registerTool",
  "registerMcpServerDefinitionProvider",
  "registerTreeDataProvider",
  "createTreeView",
  "registerWebviewViewProvider",
  "registerCustomEditorProvider",
  "registerDebugAdapterDescriptorFactory",
  "registerDebugConfigurationProvider",
] as const;
const STATUSES = [
  "registered",
  "not_found",
  "undetermined",
  "registered_undeclared",
] as const;

const siteShape = {
  module_path: z.string(),
  line: z.int().positive().nullable(),
  column: z.int().nonnegative().nullable(),
};
const authorityShape = {
  loader_authority: z.literal("candidate").nullable(),
  wrapper: z.literal("unverified").nullable(),
};
const registrationSchema = z.strictObject({
  function: z.enum(REGISTRATIONS),
  ...siteShape,
  ...authorityShape,
});
type Registration = z.output<typeof registrationSchema>;

const commandSchema = z.strictObject({
  command: z.string(),
  status: z.enum(STATUSES),
  title: z.string().nullable(),
  registrations: z.array(registrationSchema),
  keybindings: z.array(z.string()).nullable(),
});

const contributionSchema = z.strictObject({
  kind: z.enum(VSIX_CONTRIBUTION_KINDS),
  id: z.string(),
  status: z.enum(STATUSES),
  label: z.string().nullable(),
  registrations: z.array(registrationSchema),
});

const direction = z.enum(JAVASCRIPT_WEBVIEW_DIRECTIONS);
const column = z.int().nonnegative();
const line = z.int().positive();
const sendShape = { direction, type: z.string().nullable() };
const receiveShape = { direction, types: z.array(z.string()).nullable() };
const htmlShape = { html: z.string().nullable() };

/** Null when the application graph predates webview facts. */
const webviewsSchema = z
  .strictObject({
    panels: z.array(
      z.strictObject({
        view_type: z.string().nullable(),
        ...siteShape,
        ...authorityShape,
      }),
    ),
    sends: z.array(z.strictObject({ ...sendShape, ...siteShape })),
    receivers: z.array(z.strictObject({ ...receiveShape, ...siteShape })),
    html: z.array(z.strictObject({ ...htmlShape, ...siteShape })),
    api_acquisitions: z.array(z.strictObject(siteShape)),
    messages: z.array(
      z.strictObject({
        direction,
        type: z.string(),
        status: z.enum(["paired", "sent_only", "handled_only"]),
      }),
    ),
    omitted_facts: z.int().nonnegative(),
  })
  .nullable();

const languageClientShape = {
  id: z.string().nullable(),
  servers: z
    .array(
      z.strictObject({
        mode: z.enum(["run", "debug"]).nullable(),
        command: z.string().nullable(),
        module: z.string().nullable(),
      }),
    )
    .nullable(),
};
const DEBUG_ADAPTER_DESCRIPTORS = [
  "DebugAdapterExecutable",
  "DebugAdapterServer",
  "DebugAdapterNamedPipeServer",
  "DebugAdapterInlineImplementation",
] as const;

const processesSchema = z.strictObject({
  /** Static `debuggers` programs; null when not recorded. */
  declared_debug_adapters: z
    .array(
      z.strictObject({
        type: z.string().nullable(),
        program: z.string().nullable(),
        runtime: z.string().nullable(),
      }),
    )
    .nullable(),
  spawns: z.array(
    z.strictObject({
      method: z.string(),
      command: z.string().nullable(),
      argument_count: z.int().nonnegative().nullable(),
      builtin_authority: z.literal("candidate").nullable(),
      ...siteShape,
    }),
  ),
  debug_adapters: z.array(
    z.strictObject({
      descriptor: z.enum(DEBUG_ADAPTER_DESCRIPTORS),
      /** Command, port or pipe path when it is a literal first argument. */
      target: z.union([z.string(), z.number()]).nullable(),
      ...siteShape,
      ...authorityShape,
    }),
  ),
  /** Null when the application graph predates these facts. */
  language_clients: z
    .array(z.strictObject({ ...languageClientShape, ...siteShape }))
    .nullable(),
});

const extensionFactsSchema = z.object({
  facts: z.array(
    z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("send"), ...sendShape, line, column }),
      z.object({ kind: z.literal("receive"), ...receiveShape, line, column }),
      z.object({ kind: z.literal("html"), ...htmlShape, line, column }),
      z.object({ kind: z.literal("acquire"), line, column }),
      z.object({
        kind: z.literal("language_client"),
        ...languageClientShape,
        line,
        column,
      }),
    ]),
  ),
  omitted: z.int().nonnegative(),
});

const count = z.int().nonnegative();
const correlationShape = {
  commands: z.array(commandSchema),
  contributions: z.array(contributionSchema),
  menus: z
    .array(z.strictObject({ menu: z.string(), commands: z.array(z.string()) }))
    .nullable(),
  unresolved_registrations: z.array(registrationSchema),
  entry_points: z.array(
    z.strictObject({ path: z.string(), analyzed: z.boolean() }),
  ),
  summary: z.strictObject({
    declared: count,
    registered: count,
    not_found: count,
    registered_undeclared: count,
    undetermined: count,
    unresolved_registrations: count,
  }),
  webviews: webviewsSchema,
  processes: processesSchema,
  semantic_graph_truncated: z.boolean(),
};

export const vsixRegistrationCorrelationSchema = z.strictObject({
  ...correlationShape,
  source_evidence: z.strictObject({
    vsix_package_evidence_id: z.string(),
    javascript_application_evidence_id: z.string(),
  }),
  limitations: z.array(z.string()),
});

interface CorrelationInput {
  readonly contributes: Pick<
    VsixPackage["contributes"],
    | "commands"
    | "commands_omitted"
    | "menus"
    | "keybindings"
    | "declarations"
    | "debug_adapters"
  >;
  /** Entry point member paths declared by the package. */
  readonly entryPoints: readonly string[];
  /** Whether the package manifest declaring contributions was read. */
  readonly manifestRead: boolean;
  readonly semanticGraph: JavaScriptSemanticGraph;
}

const authorityFields = {
  specifier: z.literal("vscode"),
  loader_authority: z.literal("candidate").optional(),
  wrapper: z.literal("unverified").optional(),
};
const calleeSchema = z.object({
  ...authorityFields,
  path: z.tuple([z.string(), z.enum(REGISTRATIONS)]),
});
const panelCalleeSchema = z.object({
  ...authorityFields,
  path: z.tuple([z.literal("window"), z.literal("createWebviewPanel")]),
});
const argumentsSchema = z.array(
  z.object({ index: z.number(), value: z.unknown() }),
);
const isRegistrationPath = (
  path: string,
): path is keyof typeof REGISTRATION_KINDS =>
  Object.hasOwn(REGISTRATION_KINDS, path);
type Kind = (typeof REGISTRATION_KINDS)[keyof typeof REGISTRATION_KINDS];
type CallNode = JavaScriptSemanticGraph["nodes"][number];

const siteOf = (node: CallNode) => {
  const start = node.identity.source_range?.start;
  return {
    module_path: node.identity.module_path,
    line: start?.line ?? null,
    column: start?.column ?? null,
  };
};

/** The first argument when it is a literal string, otherwise null. */
const literalId = (node: CallNode): string | null => {
  const literals = argumentsSchema.safeParse(node.properties.arguments);
  const id = literals.data?.find(({ index }) => index === 0)?.value;
  return typeof id === "string" ? id : null;
};

const bySource = (
  left: ReturnType<typeof siteOf>,
  right: ReturnType<typeof siteOf>,
) =>
  compareUnicodeCodePoints(left.module_path, right.module_path) ||
  (left.line ?? 0) - (right.line ?? 0) ||
  (left.column ?? 0) - (right.column ?? 0);

type Webviews = NonNullable<z.output<typeof webviewsSchema>>;

/** Each message type per direction, and which side of it was seen. */
const pairedMessages = ({
  sends,
  receivers,
}: Pick<Webviews, "sends" | "receivers">): Webviews["messages"] =>
  JAVASCRIPT_WEBVIEW_DIRECTIONS.flatMap((direction) => {
    const sent = new Set(
      sends.flatMap((send) =>
        send.direction === direction && send.type !== null ? [send.type] : [],
      ),
    );
    const handled = new Set(
      receivers.flatMap((receiver) =>
        receiver.direction === direction ? (receiver.types ?? []) : [],
      ),
    );
    return [...new Set([...sent, ...handled])]
      .sort(compareUnicodeCodePoints)
      .map((type) => ({
        direction,
        type,
        status: !handled.has(type)
          ? ("sent_only" as const)
          : sent.has(type)
            ? ("paired" as const)
            : ("handled_only" as const),
      }));
  });

/** Panels, messaging and HTML facts in source order. */
const webviewsOf = (graph: JavaScriptSemanticGraph): Webviews | null => {
  if (graph.extension_facts !== true) return null;
  const found: Webviews = {
    panels: [],
    sends: [],
    receivers: [],
    html: [],
    api_acquisitions: [],
    messages: [],
    omitted_facts: 0,
  };
  for (const node of graph.nodes) {
    if (node.kind === "call-site") {
      const panel = panelCalleeSchema.safeParse(node.properties.module_callee);
      if (panel.success)
        found.panels.push({
          view_type: literalId(node),
          ...siteOf(node),
          loader_authority: panel.data.loader_authority ?? null,
          wrapper: panel.data.wrapper ?? null,
        });
      continue;
    }
    const recorded = extensionFactsSchema.safeParse(
      node.properties.extension_facts,
    );
    if (!recorded.success) continue;
    found.omitted_facts += recorded.data.omitted;
    const module_path = node.identity.module_path;
    for (const fact of recorded.data.facts) {
      const site = { module_path, line: fact.line, column: fact.column };
      if (fact.kind === "send")
        found.sends.push({
          direction: fact.direction,
          type: fact.type,
          ...site,
        });
      else if (fact.kind === "receive")
        found.receivers.push({
          direction: fact.direction,
          types: fact.types,
          ...site,
        });
      else if (fact.kind === "html")
        found.html.push({ html: fact.html, ...site });
      else if (fact.kind === "acquire") found.api_acquisitions.push(site);
    }
  }
  for (const list of [
    found.panels,
    found.sends,
    found.receivers,
    found.html,
    found.api_acquisitions,
  ])
    list.sort(bySource);
  return { ...found, messages: pairedMessages(found) };
};

const spawnSchema = z.object({
  method: z.string(),
  command: z.string().nullable(),
  argv_count: z.int().nonnegative().nullable(),
  builtin_authority: z.literal("candidate").optional(),
});
const descriptorCalleeSchema = z.object({
  ...authorityFields,
  path: z.tuple([z.enum(DEBUG_ADAPTER_DESCRIPTORS)]),
});

/** Where code and the manifest start language and debug servers. */
const processesOf = (
  graph: JavaScriptSemanticGraph,
  declared: VsixPackage["contributes"]["debug_adapters"],
): z.output<typeof processesSchema> => {
  const spawns: z.output<typeof processesSchema>["spawns"] = [];
  const adapters: z.output<typeof processesSchema>["debug_adapters"] = [];
  const clients: NonNullable<
    z.output<typeof processesSchema>["language_clients"]
  > = [];
  for (const node of graph.nodes) {
    if (node.kind === "child-process") {
      const spawn = spawnSchema.safeParse(node.properties);
      if (spawn.success)
        spawns.push({
          method: spawn.data.method,
          command: spawn.data.command,
          argument_count: spawn.data.argv_count,
          builtin_authority: spawn.data.builtin_authority ?? null,
          ...siteOf(node),
        });
    } else if (node.kind === "call-site") {
      const callee = descriptorCalleeSchema.safeParse(
        node.properties.module_callee,
      );
      if (!callee.success) continue;
      const target = argumentsSchema
        .safeParse(node.properties.arguments)
        .data?.find(({ index }) => index === 0)?.value;
      adapters.push({
        descriptor: callee.data.path[0],
        target:
          typeof target === "string" || typeof target === "number"
            ? target
            : null,
        ...siteOf(node),
        loader_authority: callee.data.loader_authority ?? null,
        wrapper: callee.data.wrapper ?? null,
      });
    }
    const recorded = extensionFactsSchema.safeParse(
      node.properties.extension_facts,
    );
    for (const fact of recorded.data?.facts ?? [])
      if (fact.kind === "language_client")
        clients.push({
          id: fact.id,
          servers: fact.servers,
          module_path: node.identity.module_path,
          line: fact.line,
          column: fact.column,
        });
  }
  for (const list of [spawns, adapters, clients]) list.sort(bySource);
  return {
    declared_debug_adapters: declared,
    spawns,
    debug_adapters: adapters,
    language_clients: graph.extension_facts === true ? clients : null,
  };
};

/** Registration calls by kind and literal ID; other IDs stay unresolved. */
const registrationsOf = (graph: JavaScriptSemanticGraph) => {
  const byKind: Record<Kind, Map<string, Registration[]>> = {
    command: new Map(),
    chat_participant: new Map(),
    language_model_tool: new Map(),
    mcp_server_provider: new Map(),
    view: new Map(),
    custom_editor: new Map(),
    debugger: new Map(),
  };
  const unresolved: Registration[] = [];
  for (const node of graph.nodes) {
    if (node.kind !== "call-site") continue;
    const callee = calleeSchema.safeParse(node.properties.module_callee);
    if (!callee.success) continue;
    const path = callee.data.path.join(".");
    if (!isRegistrationPath(path)) continue;
    const registration: Registration = {
      function: callee.data.path[1],
      ...siteOf(node),
      loader_authority: callee.data.loader_authority ?? null,
      wrapper: callee.data.wrapper ?? null,
    };
    const id = literalId(node);
    if (id === null) {
      unresolved.push(registration);
      continue;
    }
    const byId = byKind[REGISTRATION_KINDS[path]];
    const found = byId.get(id);
    if (found === undefined) byId.set(id, [registration]);
    else found.push(registration);
  }
  return { byKind, unresolved };
};

/**
 * Join one kind's declared IDs with its registrations. Null declarations mean
 * they were not read, so nothing is called undeclared.
 */
const joinDeclarations = (
  declared: ReadonlyMap<string, string | null> | null,
  found: ReadonlyMap<string, Registration[]>,
  {
    complete,
    allDeclared,
  }: { readonly complete: boolean; readonly allDeclared: boolean },
) =>
  [...new Set([...(declared?.keys() ?? []), ...found.keys()])]
    .sort(compareUnicodeCodePoints)
    .map((id) => {
      const registrations = found.get(id) ?? [];
      const status: (typeof STATUSES)[number] =
        declared === null
          ? "undetermined"
          : !declared.has(id)
            ? allDeclared
              ? "registered_undeclared"
              : "undetermined"
            : registrations.length > 0
              ? "registered"
              : complete
                ? "not_found"
                : "undetermined";
      return { id, status, text: declared?.get(id) ?? null, registrations };
    });

/** The first declared text for each non-null ID. */
const firstById = (
  rows: readonly (readonly [string | null, string | null])[],
) => {
  const declared = new Map<string, string | null>();
  for (const [id, text] of rows)
    if (id !== null && !declared.has(id)) declared.set(id, text);
  return declared;
};

const groupBy = <Row extends { readonly command: string | null }>(
  rows: readonly Row[] | null,
  value: (row: Row) => string | null,
) => {
  if (rows === null) return null;
  const groups = new Map<string, string[]>();
  for (const row of rows) {
    const item = value(row);
    if (row.command === null || item === null) continue;
    const group = groups.get(row.command);
    if (group === undefined) groups.set(row.command, [item]);
    else group.push(item);
  }
  return groups;
};

/**
 * Files whose calls were not analyzed: skipped or unparsed sources, and call
 * analysis dropped under a resource limit.
 */
const unanalyzedFiles = (graph: JavaScriptSemanticGraph) => {
  const paths = new Set<string>();
  let any = false;
  for (const { family, reason, evidence } of graph.unknowns) {
    const dropped =
      reason === "incomplete-module" ||
      (reason === "resource-limit" && family === "call-flow");
    if (!dropped) continue;
    const { location } = evidence;
    const path = !location.available
      ? undefined
      : location.value.kind === "artifact-path"
        ? location.value.path
        : location.value.kind === "source-range"
          ? location.value.source
          : undefined;
    if (path !== undefined) {
      paths.add(path);
      any = true;
    } else if (reason === "incomplete-module") any = true;
  }
  return { paths, any };
};

/**
 * Which declared entries had their calls analyzed, and whether an absent
 * registration can be claimed at all.
 */
const callCoverage = (
  graph: JavaScriptSemanticGraph,
  entryPoints: readonly string[],
) => {
  // Graphs recorded without callee facts hide every registration.
  const recorded = graph.callee_fact_modules?.includes("vscode") === true;
  const unanalyzed = unanalyzedFiles(graph);
  const modules = new Set(graph.nodes.map((node) => node.identity.module_path));
  const entries = entryPoints.map((path) => ({
    path,
    analyzed:
      recorded &&
      [path, path.replace(/^extension\//u, "")].some(
        (name) => modules.has(name) && !unanalyzed.paths.has(name),
      ),
  }));
  const complete =
    recorded &&
    !graph.coverage.truncated &&
    !unanalyzed.any &&
    entries.length > 0 &&
    entries.every((entry) => entry.analyzed);
  return { entries, complete };
};

/**
 * Join declared command identifiers with literal VS Code registrations. A
 * missing registration is not proof that the command has no handler.
 */
export const correlateVsixRegistrations = ({
  contributes,
  entryPoints,
  manifestRead,
  semanticGraph,
}: CorrelationInput) => {
  const { byKind, unresolved } = registrationsOf(semanticGraph);
  const declared = firstById(
    contributes.commands.map(({ command, title }) => [command, title]),
  );
  const keys = groupBy(contributes.keybindings, ({ key }) => key);
  const { entries, complete } = callCoverage(semanticGraph, entryPoints);
  // An unread manifest or a capped older list cannot show an ID is undeclared.
  const allDeclared = manifestRead && contributes.commands_omitted === 0;
  const commands = joinDeclarations(declared, byKind.command, {
    complete,
    allDeclared,
  }).map(({ id, status, text, registrations }) => ({
    command: id,
    status,
    title: text,
    registrations,
    keybindings: keys === null ? null : (keys.get(id) ?? []),
  }));
  const declaredContributions = VSIX_CONTRIBUTION_KINDS.flatMap((kind) =>
    joinDeclarations(
      contributes.declarations === null
        ? null
        : firstById(
            contributes.declarations
              .filter((row) => row.kind === kind)
              .map(({ id, label }) => [id, label]),
          ),
      byKind[kind],
      { complete, allDeclared: manifestRead },
    ).map(({ id, status, text, registrations }) => ({
      kind,
      id,
      status,
      label: text,
      registrations,
    })),
  );
  const tally = {
    registered: 0,
    not_found: 0,
    undetermined: 0,
    registered_undeclared: 0,
  };
  for (const { status } of commands) tally[status] += 1;
  const known = new Set(commands.map(({ command }) => command));
  // Grouped by menu so a long contributed menu name is retained once.
  const menus =
    contributes.menus?.map(({ menu, commands: ids }) => ({
      menu,
      commands: ids.filter((id): id is string => id !== null && known.has(id)),
    })) ?? null;
  return {
    commands,
    menus,
    contributions: declaredContributions,
    unresolved_registrations: unresolved,
    entry_points: entries,
    summary: {
      declared: declared.size,
      registered: tally.registered,
      not_found: tally.not_found,
      registered_undeclared: tally.registered_undeclared,
      undetermined: tally.undetermined,
      unresolved_registrations: unresolved.length,
    },
    webviews: webviewsOf(semanticGraph),
    processes: processesOf(semanticGraph, contributes.debug_adapters),
    semantic_graph_truncated: semanticGraph.coverage.truncated,
  };
};
