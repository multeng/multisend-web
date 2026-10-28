# Testnet balance check review — 2026-10-28

## Scope

Protected proof-verified native balance lookup and RU/EN payout-only deficit after the part preview. No signing, transfers, fee estimate, reservation, migrations, push or deployment.

## Independent review

A fresh read-only reviewer inspected both diffs/new files, API parity and pinned SDK account-absence semantics. No Critical or Minor findings.
One Important finding: fractional timer delay could fire before the deadline and never rearm, leaving stale balance visible. Reproduced by a regression test (missing expired message), then fixed by rounding up and rearming until the deadline; focus/visibility checks and cleanup retained. Regression now passes.

## Validation

- Frontend API validation:17 tests; balance UI:8 tests; final full check PASS211tests, API drift/lint/format/types/build.
- Go source conversion and authenticated HTTP behavior: exact balance, principal-only address, query override rejection, method handling, unavailable upstream and retained-cookie revocation.
- Full Go integration/vet/build and govulncheck pass. No affected symbols/imported packages; one advisory in unused dependency code remains.
- Synthetic browser session/HTTP harness: RU/EN at320,360,390,768,1280px, exact large amounts, explicit-only requests, capacity invalidation and no runtime exceptions. This is not real-wallet/device verification.
- Local production build warns about main/TON Connect chunks above500kB. No chunking changes in this task.
- Live testnet balance read FAILED after150seconds: provider secure proof-chain bootstrap timed out. Public config HTTPS and first node TCP worked; a separate40second diagnostic isolated retrieval of the master proof chain from official trusted anchor92149443 to current94210010. The diagnostic is not a passing balance test. Temporary diagnostic source removed; opt-in live regression remains. No unsafe proof fallback or invented zero.

## Decisions and limitations

- Separate balance request preserves the useful static part plan when the chain source is unavailable; fees stay unestimated and executable stays false. Choosing a combined request would require different failure handling.
- Defer fee estimation/execution/reservations until their roadmap blocks: balance coverage is only for recipient amounts. User benefit: no misleading readiness; cost if wrong: another explicit preparation step.
- Live bootstrap remains unverified for this change and must be resolved/rechecked before pilot use. No claim of successful live balance, cloud rollout or actual signing.
- User retains push/PR/merge control; no deployment or real-wallet signing implied.
