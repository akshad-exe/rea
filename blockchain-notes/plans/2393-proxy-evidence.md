# Plan: #2393 offline proxy evidence

[Issue](https://github.com/morluto/rea/issues/2393) · [Roadmap](../roadmap.md). Written 2026-11-28 against upstream `d74703ff5`. Status: draft, not started.

## Question

Given local bytecode and, optionally, storage values someone recorded: is this a known proxy, and what does it point to?

## Shape

A new operation `inspect_evm_proxy` (CLI `inspect-evm-proxy`). It is a separate tool because its input (recorded slots) and result (delegation edges) differ from `inspect_evm_interface` (`docs/development/tool-design.md`, "Decide whether to add a tool"). Names are provisional.

Pure TypeScript: no engine, worker, network or new dependency.

### Input

| Field                 | Meaning                                                                              |
| --------------------- | ------------------------------------------------------------------------------------ |
| `path`, `encoding`    | Bytecode carrier, as in the interface tool (`raw` or `hex`)                          |
| `snapshot` (optional) | `chain_id`, `block`, `account`, and the implementation, admin and beacon slot values |

Each slot is optional. A missing slot means unknown; 32 zero bytes means observed zero.

### Result

| Section                | Content                                                                                                   | Kind            |
| ---------------------- | --------------------------------------------------------------------------------------------------------- | --------------- |
| `artifact`, `bytecode` | Path, digests, lengths                                                                                    | observed        |
| `pattern`              | `erc1167` with embedded address and byte range, or `none_recognized`                                      | classification  |
| `slots`                | Each of the three: `unavailable`, `zero`, `address`, or `not_an_address` (high bytes set), with raw value | caller supplied |
| `edges`                | proxy to implementation or beacon, naming the evidence used; unresolved targets stay explicit             | inferred        |
| `limitations`          | Snapshot is unverified; no execution observed                                                             | -               |

`none_recognized` does not mean "not a proxy".

## Facts to encode

ERC-1167 runtime, exactly 45 bytes: `363d3d373d3d3d363d73` + 20-byte address + `5af43d82803e903d91602b57fd5bf3`.

| ERC-1967 slot  | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| implementation | `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc` |
| admin          | `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103` |
| beacon         | `0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50` |

Confirm all four against the EIPs before coding.

## Increments

1. **ERC-1167 only**, wired end to end through CLI and MCP.
2. **ERC-1967 slots and edges.**
3. **Proxy chains**: several supplied artifacts and snapshots; follow edges, stop on cycles, wrong chain or block, or a missing artifact.

Increments 1 and 2 can be one PR (`Refs #2393`). Increment 3 closes the issue.

## Out of scope

ERC-1822, ERC-2535 (mentioned only in a triage comment), shortened-address clone variants, calling `implementation()`, RPC, and checking that an implementation address matches supplied bytecode beyond recording the claim.

## Files

Model the footprint on `6a6e7b0bb` (OCI image layouts, a pure TypeScript tool).

| Area        | Files                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain      | `src/domain/evm/evmProxy.ts`, `evmProxyEvidence.ts`                                                                                                     |
| Reuse       | `decodeEvmBytecodeCarrier` in `src/evm/EvmBytecodeCarrier.ts`; the stable file reader used by `EvmoleInterfaceProvider`                                 |
| Application | `src/application/evm/EvmProxyService.ts`, a port if the file read needs one                                                                             |
| Contract    | `src/contracts/evm/evmToolContracts.ts` (add to `EVM_TOOL_CONTRACTS`)                                                                                   |
| Wiring      | `src/composition/evm.ts`, `capabilityDeclarations.ts`, `capabilityServices.ts`, `src/server/offlineInspectionToolBindings.ts`, `src/cli/evmCommands.ts` |
| Delivery    | `src/domain/agentBudgetOperations.ts`; a summary view only if results can grow (increment 3)                                                            |
| Docs        | `docs/guides/evm/`, the reverse-engineering skill under `.agents/skills/`                                                                               |
| Checks      | `scripts/verify/advertised-schemas/tools/inspect_evm_proxy.json`, module layer lists in `scripts/lib/`                                                  |

## Tests

Start each with a failing test.

- Exact clone: address and byte range correct, from raw and hex.
- One byte changed in prefix or suffix, 44 or 46 bytes: not recognised.
- Slot absent, zero, address, high bytes set, wrong length (rejected).
- Admin, beacon and implementation kept separate.
- Chain: cycle terminates; wrong chain or block gives no edge; missing artifact stays unresolved.
- Oversized and malformed files, cancellation.
- Same facts through CLI and MCP.

Fixtures are synthetic bytes built in the tests.

## Verify

`npm run check:fast`, `format:check`, `docs:check`, `test:focused` on the new tests, `verify:advertised-schemas`.

## Open questions

- Should a snapshot be inline input or a local JSON file? Inline is smaller; prefer it unless a maintainer says otherwise.
- Does the operation need availability limits like `evmInterface`? It has no host dependency, so check how pure tools declare this.
- The issue requires spec files under `docs/specs/`. Upstream removed them (`a1dec2d2d`, #12856) and `AGENTS.md` says to keep them out of Git. Keep this plan here and summarise the design in the PR.
