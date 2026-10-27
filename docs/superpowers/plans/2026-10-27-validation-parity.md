# Native TON validation parity implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Establish matching Go/TypeScript validation before building payout preparation.

**Architecture:** A pure Go package mirrors the existing browser policy; identical public JSON fixtures test both implementations without the sibling repository at runtime or in CI.

**Tech Stack:** Go standard library, existing TypeScript/BigInt and Vitest.

**Spec:** `../specs/2026-10-27-validation-parity-design.md`

## Global constraints

No new dependencies, migrations, API changes, transfers or deployment. Work on feature branches in existing checkouts. Draft writes remain permissive. Exact nanotons, at most200 recipients, at most500 comment code points, total below2^120. Synthetic fixtures only.

## Review focus

- Mixed friendly encodings and raw aliases must identify the same recipient.
- Invalid checksum/flags/workchains never become valid through canonicalization.
- Aggregate overflow must invalidate otherwise valid rows.
- Supplementary Unicode comments count code points, not bytes/UTF16 units.
- Source slices and results must not expose mutable shared monetary state.

### Task1: Go validation and cross-language fixtures

Files: create `internal/payouts/validation.go`, `validation_test.go`, `testdata/validation-v1.json`; frontend create `src/features/recipients/validation-v1.json` and `parity.test.ts`; copy this public spec/plan to frontend docs.

Interface: `Recipient{Address,Amount,Comment string}`, `Validate([]Recipient) Result`; Result has `Valid bool`, `TotalNano string`, `Errors []string`, `Rows []Row`; Row has `Canonical *string`, `Duplicate bool`, `Errors,Warnings []string`. Issue codes are invalid_address, invalid_amount, comment_too_long, missing_testnet_flag, empty_recipients, too_many_recipients, total_out_of_range.

- [x] Write shared synthetic fixture cases plus Go/Vitest consumers. Assert canonical, duplicate, error/warning counts, valid and exact partial total; separately assert Go codes and immutability.
- [x] Run Go test to observe missing implementation failure; run Vitest to verify existing frontend conformance and resolve any genuine drift with a regression test.
- [x] Implement strict base64/CRC/address handling and math/big exact arithmetic, preserving the existing per-row diagnostics even for oversized batches. Future HTTP preparation must enforce body limits before calling this pure function.
- [x] Run focused tests, full frontend check and backend formatting/vet/tests/build, plus govulncheck. Verify fixture copies have identical hashes.
- [x] Request fresh whole-branch review, address material findings, record results in docs/reviews and root PLAN.md. Commit independently in each repository with hooks enabled; user handles push/PR/merge.
