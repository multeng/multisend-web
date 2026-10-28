# Payout preparation report implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Protected Go validation and a wallet-specific report in the existing preview.
**Architecture:** Stateless authenticated report; existing session owns sender, SDK advertises planning capacity. Identity/source changes invalidate the browser report.
**Tech Stack:** existing Go net/http/auth, OpenAPI, React/TanStack native fetch/Zod/Vitest.
**Spec:** ../specs/2026-10-28-payout-preparation-design.md

## Global constraints

Testnet -3,200 rows, maxMessages1..255,64KiB JSON, exact strings. serviceFeeNano="0", executable=false, balance/fees explicitly unavailable. No transaction payload, dependency, migration or deployment. feature/add-payout-preparation, no worktrees or push/merge. Anonymous local input never auto-uploads.

## Review focus

Stale source/context hides late results; legacy/unknown capability gives no numeric assumption; invalid lists produce no parts; duplicates and exact totals survive every part; report never implies funds or permission to send.

### Task1: server report and public contract

Files: backend internal/payouts/preparation.go/preparation_test.go, cmd/api/main.go, api/openapi.yaml; actual auth integration fixture in internal/drafts/handler_integration_test.go. Frontend public snapshot/DTOs.

- [x] Write failing tests for Prepare([]Recipient,int) Report: exact splits, invalid rows, duplicate preservation and limits.
- [x] Implement strict handler with Principal-derived sender, required strings, bounds and no-store. Wire through auth.Protect.
- [x] Real PostgreSQL auth tests:200/400/401/403/409/413/415, revoked sessions, unknown fields.
- [x] Update OpenAPI0.4.0, publish snapshot, generate DTOs.
- [x] Run Go focused/full/integration and govulncheck.

### Task2: wallet context and frontend report

Files: auth/controller.ts and tests; features/payouts/api.ts/api.test.ts, PreparationPanel.tsx/PreparationPanel.test.tsx; recipients/RecipientEditor.tsx; i18n/catalog.ts.

- [x] Failing capability tests, then expose immutable planning context in auth state; same-account updates notify, unknown/noninteger/legacy limits rejected.
- [x] Strict generated DTO schema and bounded native request with AbortSignal.
- [x] Failing panel tests for explicit action, anonymous safety, stale source/capabilities, unmount cancellation and non-executable labels.
- [x] Integrate in existing acknowledged preview; private identity/source-scoped TanStack Query, no retries/refetch/persistence, gcTime0; safe fallback outside auth context for isolated editor tests.
- [x] RU/EN and mobile layout verification, full frontend check.
- [x] Fresh whole-branch review; record results/limitations, update roadmap, commit each repository with hooks active. User handles push/PR/merge.
