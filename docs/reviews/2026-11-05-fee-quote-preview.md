# Native fee quote preview review

Base b4acbf6; branch feature/add-fee-quote-preview. Backend consumer dependency: protected quote API/OpenAPI0.6.0 in feature/add-protected-fee-quote-api; merge backend first. Only public schema/generated types copied. No private implementation, new dependencies, wallet calls, transfers, cloud changes or deployment.

## Verification

- API behavior RED against missing implementation; shape-only client still accepted contradictory identity/accounting/expiry (13 failures), then GREEN after exact bigint/per-part/reserve/deficit and lifetime checks. Typed errors preserved by shared transport. Large amounts above JS safe integer remain exact; inputs bounded64KiB/200rows.
- UI stub RED, then explicit-only request/cancellation/errors/expiry GREEN. Change-back tests found asynchronous gcTime0 removal could revive old data; checked installed Query implementation, added per-preview useId scope, and five regressions became GREEN. Full private identity and ordered input/bounce remain in query keys, secrets excluded.
- Required response bounds and checkedAt/estimatedAt/expiresAt validated; full request duration and1s rounding deducted using performance.now. Timer re-arms on early fractional wake and checks focus/visibility. Expired/error/refresh states hide prior amounts; no background retries/refetch/persistence/replay.
- Actual PreparationPanel integration requires successful static preparation before separate quote action and cancels on session loss. Unsupported advertised capacity has a safe notice without upload. Bounce applies explicitly to all rows, initially false.
- Synthetic Edge auth/HTTP browser QA PASS RU/EN at320/360/390/768/1280px: no overflow, touch targets >=44px, exact fees/reserve/deficit, explicit-only uploads, bounce/capability invalidation,0 runtime exceptions. RU/EN390px screenshots visually inspected. Harness/images remain ignored, outside committed source.
- Full npm run check PASS258tests/24files (API drift, typed lint, formatting, typecheck, unit suite and production build). Existing Vite >500kB chunk warning remains; no chunking changes. Husky kept enabled for local commit.

## Independent review

Fresh read-only reviewer: Critical0 / Important0 / Minor2, focused51tests/3files independently PASS and schema hashes matched. Confirmed accounting, explicit query identity/cancellation, conservative expiry, safe localized UI and no send controls.

Minor follow-ups addressed: canonical quote405 now documents JSON/Allow:POST/no-store instead of shared GET/HEAD plain-text response; snapshots/types regenerated. The row-count test is accurately named and a separate test actually reverses two distinct recipients, including change-back. Added two-part UI fixture and percentage-reserve/per-part-sum API checks. No production behavior changed by these review follow-ups, no second review requested. No deferred frontend findings.

## Rulings and limitations

- Separate quote action preserves useful static preparation and independent balance lookup when estimates fail. Global bounce setting applies to every row; future per-row sending controls need a new estimate. Cost of later UI changes: invalidate/recalculate rather than reusing the quote.
- Public contract is the only copied artifact; standalone frontend build/tests do not need backend access. Backend must merge before frontend; public deployment is not implied by local branches.
- Reviewer set aside live fee accuracy, real wallet behavior, deployed frontend/API integration, remote CI, cloud resource limits, physical-device/assistive-technology behavior. These remain explicit external gates; synthetic browser/SDK tests do not establish them. No local Windows race claim.
- ACTIVE V4R2/maxMessages1..4/200rows/30s expiry and provisional once-per-ledger native-v1 reserve remain visible; executable=false. Reserve is not a fee, guarantee or locked funds. Durable immutable attempts and reconciliation remain mandatory before sending; no auto-retry of unknown operations.
