# Plan: #2392 storage layouts

[Issue](https://github.com/morluto/rea/issues/2392) · [Roadmap](../roadmap.md). Written 2026-11-28. Status: planned; code waits for [#12743](https://github.com/morluto/rea/pull/12743). The issue had no assignee and no open PR.

## Question

Where does each variable of a compiled contract live, and what moved between two builds?

## Dependency

#12743 adds the owner of compiler JSON (`src/domain/evm/solcCompilerJson.ts` for strict bounded parsing, `solcArtifactSelection.ts` for exact source and contract selection). Reuse both. Building from `upstream/main` before it merges would duplicate them.

## Operations

| Name (provisional)                 | Input                                          | Result               |
| ---------------------------------- | ---------------------------------------------- | -------------------- |
| `inspect_solidity_storage_layout`  | Standard JSON file, source name, contract name | Variables and types  |
| `compare_solidity_storage_layouts` | Two such selections                            | Changes with reasons |

No engine, execution or RPC.

## Facts to read (confirm against the Solidity documentation)

`storageLayout` and `transientStorageLayout` under `contracts.<source>.<contract>`:

- `storage[]`: `astId`, `contract`, `label`, `offset`, `slot` (decimal string), `type`
- `types{}`: `encoding` (`inplace`, `mapping`, `dynamic_array`, `bytes`), `label`, `numberOfBytes`, and `key`, `value`, `base` or `members`

## Rules

- Slots and sizes stay decimal strings; they can exceed safe integers.
- Types are a graph referenced by ID: do not expand recursively; report missing references.
- Mappings and arrays are described by how their location is derived, not by keys.
- Absent layout, empty layout and unsupported shape are three different answers.
- Persistent and transient storage stay separate.
- A layout that matches is never reported as a safe upgrade.

## Comparison

Pair by inheritance position and label, and report `added`, `removed`, `moved` (slot or offset), `type_changed`, `renamed_candidate` (same place and type, new label; marked as inference). `astId` and type IDs differ between builds, so compare type structure, not IDs.

## Increments

1. Inspect `storageLayout`.
2. `transientStorageLayout`.
3. Compare two layouts.

## Tests

Owned fixtures compiled with a pinned solc: packing, inheritance, structs, mappings, dynamic arrays, recursive types. Synthetic: missing type, oversized slot, duplicate keys, limits, cancellation. CLI and MCP parity. Large results need paging or a summary view.

## Open questions

- Does the compiler file need a caller-raisable limit beyond the 4 MiB ceiling of #12743? Real outputs with layouts can be large.
- One operation with an optional second selection, or two? Two keeps inspect and compare distinct (`tool-design.md`).
- The issue asks for spec files under `docs/specs/`; the repo removed them. Describe the design in the PR.

## Draft comment (not posted)

> @morluto @matbrgz I'd like to take this next, after #12743, because it can reuse that PR's compiler JSON reader. First step: inspect `storageLayout` for one selected source and contract (slot, offset, type, structs, mappings and arrays), offline, with missing or unsupported parts reported as such. Transient storage and comparing two builds would follow. As in #2393, I'd describe the design in the PR instead of adding files under `docs/specs/`.
