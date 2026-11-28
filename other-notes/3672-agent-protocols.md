# #3672 Agent protocols

[Issue](https://github.com/morluto/rea/issues/3672) · [Our work](our-work.md). Checked 2026-11-28: open, no assignee, no comments, no linked or matching open PR. Status: noted to work on; not planned in detail, not claimed.

## Related issues

- [#3721](https://github.com/morluto/rea/issues/3721) A2A, which says it is distinct from this issue; agree the split before code ([emerging notes](../emerging-notes/1-agentic-ai.md)).
- [#3651](https://github.com/morluto/rea/issues/3651) LLM applications, which also recovers tool schemas and MCP configuration.

## Candidate first slice

Read a saved MCP listing (`tools/list`, `resources/list`, `prompts/list`) into a structured inventory (acceptance item 2). Offline, no server started. Flagging privileged tools would be a labelled inference.

## Before code

- Check what REA already parses for MCP.
- Comment on the issue.
- Branch from `upstream/main`.

## Source text

Verbatim, heading levels shifted. Claims are the author's (matbrgz), not verified here.

### [Feature] AI agent protocol reverse engineering: MCP, A2A, OpenAI-compatible tool calling and agent-to-tool graph reconstruction

### Summary

Autonomous AI agents, coding assistants, multi-agent swarms, and agentic desktop extensions communicate via emerging agent communication protocols:

- **Model Context Protocol (MCP):** Anthropic's open standard for client-server tool invocation, prompt discovery, resource subscription, and sampling handshakes over STDIO and Server-Sent Events (SSE);
- **A2A (Agent-to-Agent):** Inter-agent delegation protocols, hierarchical supervisor-worker communications, and task handoff schemas;
- **OpenAI-Compatible Tool Calling:** Function call round-trips (`tool_calls`, `function_call`, `arguments` JSON, `role: "tool"` responses);
- **Dynamic Capabilities & Handshakes:** Tool capability negotiation, authorization boundaries, and session state lifecycles.

Currently, while REA implements MCP servers for reverse engineering tools, it has no capability to inspect and reverse engineer third-party AI agents, multi-agent frameworks (LangGraph, CrewAI, AutoGen), or agent protocol interactions.

This feature proposal introduces dedicated **AI Agent Protocol Reverse Engineering** to REA, enabling automated static extraction of agent capability manifests, tool schemas, inter-agent delegation protocols, and end-to-end agent-to-tool workflow graphs.

---

### Technical Capabilities & Architecture

```
                                    +-----------------------------------------+
                                    | Input: Agent Application Artifact       |
                                    |        (JSON configs, runtime traces)   |
                                    +--------------------+--------------------+
                                                         |
                         +-------------------------------+-------------------------------+
                         |                                                               |
                         v                                                               v
           +---------------------------+                                   +---------------------------+
           | MCP Protocol Inversion    |                                   | A2A Swarm & Delegation    |
           | (Tools, Prompts, Resources)                                   | Topology Parser           |
           +-------------+-------------+                                   +-------------+-------------+
                         |                                                               |
                         +-------------------------------+-------------------------------+
                                                         |
                                                         v
                                     +---------------------------------------+
                                     | Tool Calling & Function Schema Engine |
                                     | (Parameter Constraints, Return Types) |
                                     +-------------------+-------------------+
                                                         |
                         +-------------------------------+-------------------------------+
                         |                                                               |
                         v                                                               v
           +---------------------------+                                   +---------------------------+
           | Agent State Machine &     |                                   | Security & Sandbox        |
           | Handoff Graph Synthesis   |                                   | Boundary Auditing         |
           +-------------+-------------+                                   +-------------+-------------+
                                                         |
                                                         v
                                     +---------------------------------------+
                                     | REA Evidence: Agent Protocol Dossier, |
                                     | Swarm Topology & Tool Execution Graph |
                                     +---------------------------------------+
```

#### 1. Model Context Protocol (MCP) Inversion

- **Specification Decoding:** Parse MCP client and server communication envelopes:
  - Tool registration (`tools/list`): tool names, markdown descriptions, and input JSON schemas.
  - Resource templates (`resources/list`, `resources/templates`): URI schemes, MIME types, and dynamic resource access rules.
  - Prompt declarations (`prompts/list`): user prompt templates and argument schemas.
- **Transport Identification:** Map whether the agent communicates via standard input/output (STDIO process spawning) or HTTP with Server-Sent Events (SSE).

#### 2. A2A (Agent-to-Agent) & Swarm Delegation Topology

- **Hierarchical Swarms:** Invert multi-agent team structures:
  - Supervisor / Router agents delegating tasks to specialized subagents (Coder, Tester, Planner, Critic).
  - Task completion criteria, consensus voting, and critique-refinement loops.
- **Message Serialization:** Decode inter-agent payload formats (JSON-RPC, custom JSON envelopes, LangChain message representations).

#### 3. Tool Calling & Function Execution Wireups

- **Tool Schema Extraction:** Extract OpenAI-style `tools: [{type: "function", function: {...}}]` specifications directly from application binaries or bundles.
- **Round-Trip Tracking:** Reconstruct the complete interaction lifecycle:
  `Agent Prompt -> Model Generation (Tool Call Request) -> Tool Execution -> Tool Output Payload -> Model Synthesis`.

#### 4. Security & Sandbox Boundary Auditing

- **Permission Boundaries:** Identify which tools possess write access, shell execution permissions (`bash`, `cmd`), network access, or filesystem mutation capabilities.
- **Prompt Injection & Tool Shadowing Surfaces:** Detect unvalidated user inputs directly passed into tool arguments without sanitization or guardrails.

---

### Acceptance Criteria

1. Introduce `analyze_agent_protocol` in REA CLI and MCP contracts.
2. Ingest synthetic MCP server declarations and output structured JSON inventories of tools, prompts, and resources.
3. Map inter-agent delegation graphs across multi-agent swarms.
4. Extract tool execution schemas and parameter constraints in structured evidence.
5. Identify high-privilege tool capabilities (shell execution, file deletion) with explicit security warning annotations.

---

### Related

- [#3651](https://github.com/morluto/rea/issues/3651) [Feature] LLM application reverse engineering
- [#3323](https://github.com/morluto/rea/issues/3323) [Feature] Inspect GGUF and safetensors model files without loading them
- [#3599](https://github.com/morluto/rea/issues/3599) [Feature] Passive DNS extraction and cybersecurity analysis primitives
