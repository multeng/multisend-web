# Native fee quote preview implementation plan

> **For agentic workers:** Use superpowers:executing-plans and test-driven-development inline. Existing roadmap execution is authorized; no repeat approval.

**Goal:** Show an explicit RU/EN mobile cost estimate from the protected quote API without offering transfers.
**Architecture:** Add quote API validation and a QuotePanel after a valid preparation report. Reuse native fetch/TanStack Query, auth controller and CSS Modules. Copy only public OpenAPI snapshot and generate types locally; private backend is never required to build/test.
**Tech Stack:** Existing React/TypeScript/Radix/Zod/Vitest. No dependencies.
**Spec:** Existing testnet preparation/balance designs plus parent HANDOFF.md quote API/UI scope. Backend public OpenAPI 0.6.0 in feature/add-protected-fee-quote-api.

## Global constraints

- Branch feature/add-fee-quote-preview from b4acbf6; backend branch merges first. Owner handles push/PR/merge/deploy. No worktree/cloud changes.
- Testnet -3, ACTIVE V4R2 and advertised maxMessages 1..4 only; max200 rows, body64KiB, exact bigint/nano strings; zero service fee and native-v1 reserve remain explicit.
- Quote request only on a separate labeled action disclosing upload. Global bounce checkbox initially false sends an explicit boolean for every row; changing it invalidates/cancels the estimate. No wallet calls.
- Private keys include user/address/network/full ordered input/capacity/bounce; no CSRF secrets in keys, no retries/focus or reconnect refetch/cache persistence/offline replay. Input/account/network/session/capability changes remove old results and cancel in-flight requests.
- Validate response shape, identity, exact totals/per-part costs, reserve/required/deficit and bounded expiry. Deduct the full request duration plus 1s rounding using performance.now; expire via timer/focus/visibility and require explicit recheck. No wall-clock trust or automatic refresh.
- RU/EN: payouts, service0, estimated network cost, provisional reserve, required balance, verified balance, deficit, parts/signature count and expiry. Always executable=false and no send readiness claim. Unsupported wallet, busy, unavailable, insufficient and incomplete have safe messages.

## Review focus

- Large exact amounts and contradictory per-part accounting must not become plausible totals.
- Changed row/order/comment/bounce/capacity and wallet/session identities must never show old quotes, including late replies and change-back.
- Expired or slow responses and early fractional timers must hide current amounts rather than extend validity.
- Failed estimates must not display zeros; error codes must survive runtime parsing.
- RU/EN layout at320/360/390/768/1280px; keyboard/focus and meaningful labels; no automatic recipient uploads or send action.

### Task 1: Public contract and validated client

**Files:** api/openapi.yaml; src/api/generated; src/api/request.ts; src/features/payouts/quote.ts, quote.test.ts, quote-fixtures.test-data.ts.
**Interface:** quotePayout(input: FeeQuoteInput,csrf:string,signal:AbortSignal): Promise<{report:FeeQuoteReport,validUntil:number}>.

- [x] Copy only public schema, regenerate types; verify identical snapshot hash and standalone api:check.
- [x] RED exact request/precision, error codes, malformed/contradictory/foreign/expired result and slow-response tests.
- [x] GREEN minimal schema+accounting+validity checks and safe typed transport errors.
- [x] Focused tests PASS.

### Task 2: Explicit mobile quote UI

**Files:** QuotePanel.tsx/.module.css/tests; PreparationPanel.tsx/tests; i18n/catalog.ts.
**Interface:** QuotePanel consumes preparation input, authenticated session and controller. Private query returns validated quote result.

- [x] RED explicit-only upload, bounce invalidation/abort/late result, identity/capability/session changes, expiry/focus, error handling/401 and RU/EN costs.
- [x] GREEN UI, temporary reserve explanation and shared existing button sizing, no send button.
- [x] Full npm run check and synthetic mobile browser verification; preserve Husky for commit.
- [x] Fresh read-only whole-branch review; meaningful RED/GREEN fixes for material issues. Update reviews, parent PLAN/HANDOFF and local commit. No deployment/CI/live wallet claim.

## Execution record

- Baseline npm test PASS211tests/22files before edits. Go backend contract/lifecycle and19 Sandbox tests verified separately.
- Ruling: separate estimate button preserves static preparation and optional balance lookup on unavailable fee source. Global bounce setting applies explicitly to all rows; per-recipient controls can be designed with the later sending flow. Cost if changed later: a new estimate is required.

- Implementation and independent review complete: Critical0/Important0/Minor2 addressed (quote405 contract and distinct-row reorder regression). Added percentage-reserve/multi-part checks. Synthetic RU/EN10viewport browser PASS; final npm check/Husky results recorded in parent handoff. No push/merge/deploy/live-wallet verification.
