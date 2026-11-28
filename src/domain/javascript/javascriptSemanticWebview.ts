import * as t from "@babel/types";

import type {
  JavaScriptSemanticExtensionFact,
  JavaScriptWebviewDirection,
} from "./javascriptSemanticIr.js";
import {
  semanticStaticPropertyKey,
  unwrapJavaScriptExpression,
} from "./javascriptAstValues.js";
import { unwrapPureSemanticSequenceExpression } from "./javascriptSemanticCallResolution.js";
import {
  resolveSemanticBindingState,
  type JavaScriptSemanticAnalysisState,
  type JavaScriptSemanticBindingState,
} from "./javascriptSemanticState.js";
import { traverseJavaScriptValueAst } from "./javascriptSemanticTraversal.js";
import { range } from "./javascriptStaticAnalysisHelpers.js";

/** Property names conventionally naming a message's type. */
const TYPE_KEYS = new Set(["type", "command", "method"]);

interface WebviewContext {
  readonly state: JavaScriptSemanticAnalysisState;
  /** Function declarations and function-valued variables by binding. */
  readonly functions: Map<JavaScriptSemanticBindingState, t.Function>;
}

const unwrapped = (node: t.Node, { state }: WebviewContext): t.Node =>
  unwrapJavaScriptExpression(unwrapPureSemanticSequenceExpression(node, state))
    .node;

const memberKey = (node: t.Node): string | null =>
  t.isMemberExpression(node) || t.isOptionalMemberExpression(node)
    ? semanticStaticPropertyKey(node.property, node.computed)
    : null;

const binding = (node: t.Identifier, { state }: WebviewContext) =>
  resolveSemanticBindingState(state, node, node.name);

const isGlobal = (node: t.Node, name: string, context: WebviewContext) =>
  t.isIdentifier(node, { name }) && binding(node, context) === undefined;

/** `x.webview` or a binding named `webview`. */
const isWebview = (node: t.Node, context: WebviewContext): boolean => {
  const target = unwrapped(node, context);
  return (
    (t.isIdentifier(target) ? target.name : memberKey(target)) === "webview"
  );
};

const isAcquireCall = (node: t.Node, context: WebviewContext): boolean => {
  const call = unwrapped(node, context);
  return (
    t.isCallExpression(call) &&
    isGlobal(call.callee, "acquireVsCodeApi", context)
  );
};

/** The webview API object, called directly or through its binding. */
const isWebviewApi = (node: t.Node, context: WebviewContext): boolean => {
  const target = unwrapped(node, context);
  if (isAcquireCall(target, context)) return true;
  if (!t.isIdentifier(target)) return false;
  return (
    binding(target, context)?.initializers.some(
      (initializer) =>
        initializer.projection.length === 0 &&
        isAcquireCall(initializer.node, context),
    ) === true
  );
};

const fixedText = (node: t.Node): string | null =>
  t.isStringLiteral(node)
    ? node.value
    : t.isTemplateLiteral(node) && node.expressions.length === 0
      ? (node.quasis[0]?.value.cooked ?? null)
      : null;

const messageType = (
  message: t.Node | undefined,
  context: WebviewContext,
): string | null => {
  if (message === undefined) return null;
  const object = unwrapped(message, context);
  if (!t.isObjectExpression(object)) return null;
  for (const property of object.properties) {
    if (!t.isObjectProperty(property)) continue;
    const key = semanticStaticPropertyKey(property.key, property.computed);
    if (key !== null && TYPE_KEYS.has(key)) return fixedText(property.value);
  }
  return null;
};

/**
 * The string message types one handler compares against, read from `x.type`,
 * `x.command`, `x.method` or a destructured name, where `x` is the message parameter, its
 * `.data`, or a local alias of either. Null when the handler is not local.
 */
const handledTypes = (
  handler: t.Node | undefined,
  context: WebviewContext,
): string[] | null => {
  if (handler === undefined) return null;
  const target = unwrapped(handler, context);
  const resolved = t.isFunction(target)
    ? target
    : t.isIdentifier(target)
      ? context.functions.get(binding(target, context)!)
      : undefined;
  if (resolved === undefined) return null;
  const parameter = resolved.params[0];
  const messages = new Set<JavaScriptSemanticBindingState>();
  const discriminants = new Set<JavaScriptSemanticBindingState>();
  const declare = (pattern: t.Node): void => {
    if (t.isIdentifier(pattern)) {
      const found = binding(pattern, context);
      if (found !== undefined) messages.add(found);
      return;
    }
    if (!t.isObjectPattern(pattern)) return;
    for (const property of pattern.properties) {
      if (!t.isObjectProperty(property)) continue;
      const key = semanticStaticPropertyKey(property.key, property.computed);
      if (key === "data") declare(property.value);
      else if (key !== null && TYPE_KEYS.has(key)) {
        const found = t.isIdentifier(property.value)
          ? binding(property.value, context)
          : undefined;
        if (found !== undefined) discriminants.add(found);
      }
    }
  };
  if (parameter !== undefined) declare(parameter);
  const isMessage = (node: t.Node): boolean => {
    const value = unwrapped(node, context);
    if (t.isIdentifier(value)) {
      const found = binding(value, context);
      return found !== undefined && messages.has(found);
    }
    return (
      memberKey(value) === "data" &&
      isMessage((value as t.MemberExpression).object)
    );
  };
  const isDiscriminant = (node: t.Node): boolean => {
    const value = unwrapped(node, context);
    if (t.isIdentifier(value)) {
      const found = binding(value, context);
      return found !== undefined && discriminants.has(found);
    }
    const key = memberKey(value);
    return (
      key !== null &&
      TYPE_KEYS.has(key) &&
      isMessage((value as t.MemberExpression).object)
    );
  };
  const types = new Set<string>();
  const add = (node: t.Node) => {
    const text = fixedText(node);
    if (text !== null) types.add(text);
  };
  traverseJavaScriptValueAst(resolved, context.state.erasedSyntaxNodes, {
    enter: (node) => {
      if (t.isVariableDeclarator(node) && node.init && isMessage(node.init))
        declare(node.id);
      else if (t.isSwitchStatement(node) && isDiscriminant(node.discriminant))
        for (const branch of node.cases) {
          if (branch.test) add(branch.test);
        }
      else if (
        t.isBinaryExpression(node) &&
        (node.operator === "===" || node.operator === "==")
      ) {
        if (isDiscriminant(node.left)) add(node.right);
        else if (isDiscriminant(node.right)) add(node.left);
      }
    },
    exit: () => {},
  });
  return [...types].sort();
};

/**
 * Webview messaging and HTML facts, recognized by name: `*.webview`, the
 * global `acquireVsCodeApi` and `window` "message" listeners. Nothing is
 * evaluated.
 */
export const collectJavaScriptSemanticWebview = (
  program: t.Program,
  state: JavaScriptSemanticAnalysisState,
): readonly JavaScriptSemanticExtensionFact[] => {
  const context: WebviewContext = { state, functions: new Map() };
  const calls: t.CallExpression[] = [];
  const facts: JavaScriptSemanticExtensionFact[] = [];
  traverseJavaScriptValueAst(program, state.erasedSyntaxNodes, {
    enter: (node) => {
      const [name, value] = t.isFunctionDeclaration(node)
        ? [node.id, node]
        : t.isVariableDeclarator(node)
          ? [node.id, node.init]
          : [];
      if (t.isIdentifier(name) && value && t.isFunction(value)) {
        const found = binding(name, context);
        if (found !== undefined) context.functions.set(found, value);
      }
      if (t.isCallExpression(node) || t.isOptionalCallExpression(node))
        calls.push(node as t.CallExpression);
      if (
        t.isAssignmentExpression(node, { operator: "=" }) &&
        memberKey(node.left) === "html" &&
        isWebview((node.left as t.MemberExpression).object, context)
      )
        facts.push({
          kind: "html",
          html: fixedText(unwrapped(node.right, context)),
          location: range(node),
        });
    },
    exit: () => {},
  });
  // Handlers may be declared after the call that registers them.
  for (const call of calls) {
    const location = range(call);
    if (isAcquireCall(call, context)) {
      facts.push({ kind: "acquire", location });
      continue;
    }
    const callee = unwrapped(call.callee, context);
    const method = memberKey(callee);
    if (method === null) continue;
    const { object } = callee as t.MemberExpression;
    const [first, second] = call.arguments;
    const send = (direction: JavaScriptWebviewDirection) =>
      facts.push({
        kind: "send",
        direction,
        type: messageType(first, context),
        location,
      });
    const receive = (
      direction: JavaScriptWebviewDirection,
      handler: t.Node | undefined,
    ) =>
      facts.push({
        kind: "receive",
        direction,
        types: handledTypes(handler, context),
        location,
      });
    if (method === "postMessage") {
      if (isWebview(object, context)) send("to_webview");
      else if (isWebviewApi(object, context)) send("to_extension");
    } else if (method === "onDidReceiveMessage" && isWebview(object, context))
      receive("to_extension", first);
    else if (
      method === "addEventListener" &&
      isGlobal(unwrapped(object, context), "window", context) &&
      first !== undefined &&
      fixedText(first) === "message"
    )
      receive("to_webview", second);
  }
  return facts;
};
