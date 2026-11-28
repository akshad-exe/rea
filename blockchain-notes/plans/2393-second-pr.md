# Second PR for #2393: proxy chains

Branch `feat/evm-proxy-chains` on the fork, commit `d7ad40816`. Not opened.

## Before opening

1. [#14951](https://github.com/morluto/rea/pull/14951) is merged. Its review fixes change files this branch also changes.
2. Merge `upstream/main` into the branch and resolve conflicts (the first PR is squash-merged).
3. Rerun the checks below and the real-contract test; update the numbers.
4. Check whether the review comments on #14951 also apply to code added here (per related file).
5. Open as draft. The readiness boxes belong to the human owner.

[Compare view](https://github.com/morluto/rea/compare/main...akshad-exe:rea:feat/evm-proxy-chains) (includes the first PR's commits until it merges).

## Title

feat(evm): follow offline proxy chains through supplied accounts

## Description

## Summary

`inspect_evm_proxy` accepts `related` accounts and follows inferred edges from the root through them.

Fixes #2393.

## Problem and expected behavior

A single result names a target but cannot say whether it was supplied, belongs to the same chain and block, or loops back. Each step is now marked `supplied`, `not_supplied`, `snapshot_mismatch` or `cycle`.

## Change and scope

- Edges are followed only between entries with the root's chain and block; each account is expanded once, without recursion.
- An account may be supplied once per chain and block; `related` requires a root `snapshot`.
- No summary view: output grows with the number of related accounts.
- A beacon's implementation is not resolved. No execution or RPC.
- #2393 asks for spec files under `docs/specs/`; #12856 removed those, so the design is described here.

## Evidence

- Tests cover missing targets, self and two-account cycles, another block, a shared target, a 20,000-account chain, duplicate entries and a failing related file.
- Deployed contracts, mainnet block 26510776, read from one public node and passed to the offline CLI (to be rerun before opening):
  - `0x516d31321928700c6b4fb0db0c8c6bc5d6799787` → `0x7f9f70da4af54671a6abac58e705b5634cac8819`, `erc1167_bytecode`, `supplied`
  - `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` → `0x4295fe69b3e978eb511e4558b4407ad871612fcb`, `erc1967_implementation_slot`, `supplied`
- Gaps: cycle and mismatch cases use synthetic inputs only.

## Validation at `d7ad40816`

- `check:fast`, `format:check`, `docs:check`: passed
- `verify:advertised-schemas -- --update-summary`: updated; RE2 C++ and Rust engines not installed
- `test:focused` on the selected files: 262 passed
- Full suite: not run

## Author readiness

Human owner: @akshad-exe

- [ ] I reviewed the final diff and relevant existing code, understand the change and its edge cases, and take responsibility for the complete PR, including AI-assisted work.
- [ ] I checked the evidence above, confirmed it supports the current change, and recorded meaningful validation gaps.
- [ ] I declare this PR ready for initial maintainer review.
