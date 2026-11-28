import * as t from "@babel/types";

import type {
  JavaScriptSemanticExtensionFact,
  JavaScriptSemanticLanguageServer,
} from "./javascriptSemanticIr.js";
import {
  semanticStaticPropertyKey,
  unwrapJavaScriptExpression,
} from "./javascriptAstValues.js";
import { unwrapPureSemanticSequenceExpression } from "./javascriptSemanticCallResolution.js";
import {
  resolveSemanticBindingState,
  type JavaScriptSemanticAnalysisState,
} from "./javascriptSemanticState.js";
import { traverseJavaScriptValueAst } from "./javascriptSemanticTraversal.js";
import { range } from "./javascriptStaticAnalysisHelpers.js";

/** Local aliases and nested option objects followed before giving up. */
const MAX_FOLLOWED_VALUES = 4;

/** An expression, with a binding's single initializer followed. */
const followed = (
  node: t.Node,
  state: JavaScriptSemanticAnalysisState,
  depth: number,
): t.Node => {
  const value = unwrapJavaScriptExpression(
    unwrapPureSemanticSequenceExpression(node, state),
  ).node;
  if (!t.isIdentifier(value) || depth >= MAX_FOLLOWED_VALUES) return value;
  const binding = resolveSemanticBindingState(state, value, value.name);
  const [only, ...others] = binding?.initializers ?? [];
  return only === undefined ||
    others.length > 0 ||
    only.projection.length > 0 ||
    binding?.definitions.length !== 1
    ? value
    : followed(only.node, state, depth + 1);
};

const calledName = (node: t.Node): string | null =>
  t.isIdentifier(node)
    ? node.name
    : t.isMemberExpression(node) || t.isOptionalMemberExpression(node)
      ? semanticStaticPropertyKey(node.property, node.computed)
      : null;

/**
 * A path or command written as fixed text, including `asAbsolutePath(x)` and
 * `join(...)` of fixed text. A leading non-literal `join` base is not guessed.
 */
const fixedPath = (
  node: t.Node,
  state: JavaScriptSemanticAnalysisState,
  depth = 0,
): string | null => {
  if (depth >= MAX_FOLLOWED_VALUES) return null;
  const value = followed(node, state, depth);
  if (t.isStringLiteral(value)) return value.value;
  if (t.isTemplateLiteral(value) && value.expressions.length === 0)
    return value.quasis[0]?.value.cooked ?? null;
  if (!t.isCallExpression(value)) return null;
  const name = calledName(value.callee);
  if (name !== "asAbsolutePath" && name !== "join") return null;
  const parts = value.arguments.map((argument) =>
    fixedPath(argument, state, depth + 1),
  );
  if (parts.length === 0 || parts.some((part) => part === null)) return null;
  return name === "asAbsolutePath" ? (parts[0] ?? null) : parts.join("/");
};

/** `Executable` and `NodeModule` options, directly or under run and debug. */
const servers = (
  node: t.Node,
  state: JavaScriptSemanticAnalysisState,
  mode: JavaScriptSemanticLanguageServer["mode"] = null,
): JavaScriptSemanticLanguageServer[] => {
  const options = followed(node, state, 0);
  if (!t.isObjectExpression(options)) return [];
  const properties = new Map<string, t.Node>();
  for (const property of options.properties) {
    if (!t.isObjectProperty(property)) continue;
    const key = semanticStaticPropertyKey(property.key, property.computed);
    if (key !== null) properties.set(key, property.value);
  }
  const command = properties.get("command");
  const module = properties.get("module");
  if (command !== undefined || module !== undefined)
    return [
      {
        mode,
        command: command === undefined ? null : fixedPath(command, state),
        module: module === undefined ? null : fixedPath(module, state),
      },
    ];
  if (mode !== null) return [];
  return (["run", "debug"] as const).flatMap((name) => {
    const nested = properties.get(name);
    return nested === undefined ? [] : servers(nested, state, name);
  });
};

/** Bindings of local classes that extend a class named `LanguageClient`. */
const subclassBindings = (
  program: t.Program,
  state: JavaScriptSemanticAnalysisState,
) => {
  const found = new Set<unknown>();
  traverseJavaScriptValueAst(program, state.erasedSyntaxNodes, {
    enter: (node, parent) => {
      const [name, value] = t.isClassDeclaration(node)
        ? [node.id, node]
        : t.isVariableDeclarator(node)
          ? [node.id, node.init]
          : [];
      if (
        t.isIdentifier(name) &&
        t.isClass(value) &&
        value.superClass &&
        calledName(value.superClass) === "LanguageClient"
      )
        // A declaration's own name is bound in the enclosing scope.
        found.add(
          resolveSemanticBindingState(
            state,
            t.isClassDeclaration(node) ? (parent ?? name) : name,
            name.name,
          ),
        );
    },
    exit: () => {},
  });
  found.delete(undefined);
  return found;
};

/**
 * `new LanguageClient(...)` constructions, including local subclasses, recognized by class name because
 * extensions usually bundle the library. Servers are null when the options are
 * not a local object naming a command or module.
 */
export const collectJavaScriptSemanticLanguageClients = (
  program: t.Program,
  state: JavaScriptSemanticAnalysisState,
): readonly JavaScriptSemanticExtensionFact[] => {
  const facts: JavaScriptSemanticExtensionFact[] = [];
  const subclasses = subclassBindings(program, state);
  const isClient = (callee: t.Node) =>
    calledName(callee) === "LanguageClient" ||
    (t.isIdentifier(callee) &&
      subclasses.has(resolveSemanticBindingState(state, callee, callee.name)));
  traverseJavaScriptValueAst(program, state.erasedSyntaxNodes, {
    enter: (node) => {
      if (!t.isNewExpression(node) || !isClient(node.callee)) return;
      const [first, second, third] = node.arguments;
      // (id, name, serverOptions, ...) or (name, serverOptions, ...).
      const options =
        t.isStringLiteral(second) || node.arguments.length >= 4
          ? third
          : second;
      const found = options === undefined ? [] : servers(options, state);
      facts.push({
        kind: "language_client",
        id: first === undefined ? null : fixedPath(first, state),
        servers: found.length === 0 ? null : found,
        location: range(node),
      });
    },
    exit: () => {},
  });
  return facts;
};
