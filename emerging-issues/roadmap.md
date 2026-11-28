# Emerging domains roadmap

[Master tracker](README.md). Checked 2026-11-28; recheck issues and open PRs before starting any item. Searches matched PR titles and issue cross-references only.

## Candidates

Offline parsing with no new engine. By my reading of `CONTRIBUTING.md` this is format inspection and needs no advance decision; a maintainer can still decline.

| Order | Issue                                                                   | First slice                                                       | Why                                                          | Watch                                                                                               |
| ----- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 1     | [#3620](https://github.com/morluto/rea/issues/3620) shaders             | DXBC part table and SPIR-V header, entry points, capabilities     | The maintainer proposed this slice and named a public corpus | Large audience; someone may start quickly, so comment first                                         |
| 2     | [#3652](https://github.com/morluto/rea/issues/3652) PyTorch checkpoints | List pickle globals and flag unsafe ones without running anything | Clear value; `inspect_model_artifact` left these out         | Reuse the existing ZIP and pickle readers if present                                                |
| 3     | [#3653](https://github.com/morluto/rea/issues/3653) tokenizers          | `tokenizer.json`: algorithm, vocabulary size, special tokens      | Small and exact                                              | SentencePiece and chat templates are later slices                                                   |
| 4     | [#3637](https://github.com/morluto/rea/issues/3637) model graphs        | ONNX inputs, outputs, operators                                   | Builds on `inspect_model_artifact`                           | [#8255](https://github.com/morluto/rea/pull/8255) is open for the sibling `.ort` format; coordinate |

## Added outside the tracker

[#3672](../other-issues/3672-agent-protocols.md) agent protocols (MCP, A2A, tool calling): we intend to work on it. Settle the overlap with #3721 and #3651 first.

## Claimed

| Issue                                                                      | Why leave it                                                                                                                 |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [#2350](https://github.com/morluto/rea/issues/2350) WebAssembly components | all-black-493 offered a PR; [#2406](https://github.com/morluto/rea/pull/2406) is open (conflicting, last updated 2026-11-25) |

## Later: broad, split first

| Issue                                                                      | Note                                             |
| -------------------------------------------------------------------------- | ------------------------------------------------ |
| [#3721](https://github.com/morluto/rea/issues/3721) A2A                    | Agent Card parsing could stand alone             |
| [#3651](https://github.com/morluto/rea/issues/3651) LLM applications       | Heuristic recovery across several languages      |
| [#3722](https://github.com/morluto/rea/issues/3722) on-device AI           | Overlaps #3637; needs real model packages        |
| [#3673](https://github.com/morluto/rea/issues/3673) compiler IR            | MLIR bytecode is versioned and dialect-dependent |
| [#3723](https://github.com/morluto/rea/issues/3723) confidential computing | Certificate verification needs vendor trust data |
| [#3724](https://github.com/morluto/rea/issues/3724) post-quantum           | Binary fingerprinting risks false matches        |
| [#3725](https://github.com/morluto/rea/issues/3725) vehicles               | Several protocols; one at a time                 |
| [#3726](https://github.com/morluto/rea/issues/3726) Matter and Thread      | A TLV decoder could stand alone                  |
| [#3727](https://github.com/morluto/rea/issues/3727) WebGPU                 | Needs a WGSL parser and JavaScript dataflow      |

## Rules

- Finish or hand off the open proxy work first.
- Branch from `upstream/main`, never from the fork's `main`.
- Comment on the issue before writing code.
- No spec or plan files in a PR.
- After opening a PR, fix CI and Greptile findings until it passes and scores 5/5.
