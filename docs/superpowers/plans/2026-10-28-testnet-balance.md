# Testnet Balance Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show an authenticated proof-verified testnet balance and exact payout-only deficit.
**Architecture:** Reuse proof provider; independent protected GET and explicitly triggered private UI query.
**Tech Stack:** Existing Go, tonutils-go, OpenAPI, React, TanStack Query, Zod, Vitest.
**Spec:** ../specs/2026-10-28-testnet-balance-design.md

## Global Constraints

- Separate feature/add-testnet-balance-check branches; no worktree, push, merge or deployment.
- Testnet -3, exact decimal nano strings, no private data logs, no new dependencies/migrations.
- Executable remains false; fees remain not_estimated; stage 2 is not complete.

## Review Focus

- Failed or malformed network lookup must never be displayed as zero balance.
- Authenticated identity alone selects address; no caller-supplied account override.
- Late reads and old/cross-account reports must not look current.
- Exact payout coverage cannot imply gas coverage or send readiness.
- Unknown/frozen/uninitialized account state cannot imply spendability.

## Task 1: Verified source and protected HTTP contract

Files: internal/tonproof/provider.go, balance.go and balance_test.go; internal/payouts/balance.go; cmd/api/main.go; internal/drafts/handler_integration_test.go; api/openapi.yaml.
Interfaces: tonproof.BalanceSnapshot; Provider.Balance(context.Context,string) (BalanceSnapshot,error); payouts.NewBalanceHandler(func(context.Context,string)(tonproof.BalanceSnapshot,error)) http.Handler.

- [x] Write source conversion/age and protected HTTP behavior tests; run and observe missing implementation/404.
- [x] Implement verified snapshot reuse, strict conversion and principal-only GET; update OpenAPI.
- [x] Run Go tests and dedicated-Postgres integration. Expected: PASS with no external RPC required.

## Task 2: Explicit client balance and shortfall

Files: public api/openapi.yaml/generated DTOs; src/features/payouts/balance.ts, BalancePanel.tsx and tests; PreparationPanel.tsx; i18n/catalog.ts.
Interfaces: readBalance(address,signal) -> validated BalanceReport plus monotonic deadline; BalancePanel consumes session/controller, totalNano and full input identity.

- [x] Write failing API/UI tests for bounds/identity, explicit request, exact shortfall, errors/expiry/cancellation.
- [x] Implement runtime validation, no-retry private query, expiry display and RU/EN text.
- [x] Run npm run check. Expected: PASS including API drift/typecheck/tests/build.

## Task 3: Review and handoff

- [x] Verify mobile RU/EN layouts and no automatic balance requests; run full backend integration/Vuln and frontend check.
- [x] Fresh whole-branch review; fix critical/important findings with RED/GREEN.
- [x] Record limitations/results in docs/reviews and parent PLAN.md, commit both branches with hooks enabled.

Validation: final frontend npm run check PASS211tests; Go check.ps1 -Integration -Vuln PASS. Synthetic RU/EN browser passes. Opt-in live read FAIL due secure chain bootstrap timeout; explicitly not a successful live balance test. See docs/reviews/2026-10-28-testnet-balance.md.
