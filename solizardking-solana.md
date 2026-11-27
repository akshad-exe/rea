# Solizardking: Solana work (PR [#7339](https://github.com/morluto/rea/pull/7339))

[Master tracker](README.md).

Checked 2026-11-28 at head `cafa37dcd`. This covered the description, file list, guide, composition wiring, threads, CI and fork branches. It was **not** a line-by-line code audit, and no tests were run.

**What the PR adds** (60 files, +8,672 / −19):
- `analyze_solana_program`: sBPF ELF64 parser, linear disassembler, Anchor dispatch recovery, syscall name resolution; input is a local file or a read-only RPC fetch by program id.
- `analyze_solana_programs`: batch mode, optional hand-off folder for Ghidra/IDA.
- `solana_receipts`: joins an analysis with recorded differential-test results.
- A guide, a skill reference and tests.

**State:**
- 15 commits ahead, 297 behind `main`. Conflicts: `scripts/lib/module-layers.mjs`, `scripts/lib/test-projects.mjs`, `src/composition/capabilityDeclarations.ts`, `src/composition/capabilityServices.ts`, `src/server/createServer.ts`.
- 37 of 38 review threads resolved. The open one (`SolanaElf.ts`, shared symbol names repeated downstream) is partly left open by the author as a maintainer decision.
- The only check reported is Greptile (pass); no build or test CI is listed.
- Human owner is blank and readiness boxes are unchecked. The description says an AI agent prepared it.
- The description is stale: it says 42 files and 47 tests at an older commit.
- No maintainer scope decision for the new domain is recorded in the PR.

**Relation to [#2003](https://github.com/morluto/rea/issues/2003):** the PR says no related issue exists, but [#2003](https://github.com/morluto/rea/issues/2003) covers this area and is not linked.

| [#2003](https://github.com/morluto/rea/issues/2003) asks for | In [#7339](https://github.com/morluto/rea/pull/7339) (from its guide) |
| --- | --- |
| Offline only, no RPC | Includes optional RPC fetch |
| Instruction names recovered from Anchor log strings | Names only when the caller supplies them |
| Account and event type discriminators | Not described |
| ELF facts, version, entrypoint, syscalls | Covered |
| Engine: adapt `sbpf-inspect` WASM (proposal by trenbonole) | Own TypeScript decoder |

trenbonole offered on [#2003](https://github.com/morluto/rea/issues/2003) to implement the first increment; bornsl0ppy offered to test and review.

**Other work on Solizardking's fork, not in the PR:**
- Fork `main` (merged through fork PRs [#3](https://github.com/Solizardking/rea/pull/3) and [#4](https://github.com/Solizardking/rea/pull/4), Nov 25–26): Solana formal verification (Certora, Harmonic Aristotle) service, provider and skills, plus a `ree` skill and README changes.
- `feat/solana-tag-dispatch-core` (Oct 28): 1-byte Shank/Borsh tag dispatch and a Metaplex Core loop.
- `feat/solana-sbpf` (Oct 26): an earlier attempt touching the Ghidra, Hopper and IDA paths.
- From branch names and commits, the latest activity is formal verification. Whether it will be sent upstream is unknown.

## How we avoid conflicts

**Leave to Solizardking:**
- Solana sBPF program analysis: `src/solana/`, `src/domain/solana/`, `src/application/solana/`, `src/contracts/solana/`, `src/ports/solana/`, the Solana CLI, composition, guide and skill files.
- Anything on [#2003](https://github.com/morluto/rea/issues/2003) until the overlap is settled. trenbonole also offered to implement it.
- Formal verification and tag dispatch, which exist only on the fork.

**Talk first:** [#3747](https://github.com/morluto/rea/issues/3747) (Solana transactions) has no linked PR and is a separate issue, but would likely share the Solana domain.

**Shared files [#7339](https://github.com/morluto/rea/pull/7339) changes** (any new domain is likely to edit these too):
- `.agents/skills/reverse-engineer-anything/SKILL.md`
- `.cursor-plugin/skills/reverse-engineer-anything/SKILL.md`
- `.gitignore`
- `docs/.vitepress/documentation.ts`
- `docs/README.md`
- `docs/getting-started/cli.md`
- `scripts/lib/module-layers.mjs`
- `scripts/lib/test-projects.mjs`
- `scripts/verify/fixed-ceiling-registry.json`
- `src/cli.ts`
- `src/cli/cliCommandRegistrations.ts`
- `src/composition/capabilityDeclarations.ts`
- `src/composition/capabilityServices.ts`
- `src/contracts/toolContracts.ts`
- `src/contracts/toolFamilies.ts`
- `src/domain/artifactInspection.ts`
- `src/domain/binaryTarget.ts`
- `src/domain/elfFixedHeader.ts`
- `src/server/createServer.ts`
- `src/server/offlineInspectionToolBindings.ts`
- `tests/conformance/providerCapabilityCases.ts`
- `tests/support/providerLifecycleCoverage.ts`

**Changed by both [#7339](https://github.com/morluto/rea/pull/7339) and our [#12743](https://github.com/morluto/rea/pull/12743)** (at head `cafa37dcd`):
- `.agents/skills/reverse-engineer-anything/SKILL.md`
- `.cursor-plugin/skills/reverse-engineer-anything/SKILL.md`
- `scripts/verify/fixed-ceiling-registry.json`

Do not open a parallel Solana PR. A review comment on the [#2003](https://github.com/morluto/rea/issues/2003) overlap needs our approval before posting.
