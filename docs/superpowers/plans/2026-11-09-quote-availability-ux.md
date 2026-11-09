# Explain quote availability and bounce

Base origin/main de7d63b, fetched after user merged MIME fix. Continue agreed
stage2 UX cleanup before separate rollout/device/resource verification.

## Design and scope

Frontend-only RU/EN text and accessibility improvements. Keep calculations,
auth, expiry, limits, cache isolation and explicit request behavior unchanged.
No backend/public contract changes or extra requests to guess a wallet version.
Do not suggest activation transfers, new wallets or funding as error recovery.

- Unsupported capacity: state the advertised number and current 1–4 limit.
  Keep the estimate unavailable and preserve editor/draft guidance.
- Balance states: explain ACTIVE/UNINIT/FROZEN/NON_EXIST using the actual report.
  ACTIVE alone must not assert V4R2 support or spendability.
- Backend unsupported_wallet combines causes; explain that either contract
  state or version is unsupported without inventing which failed. A separate
  balance snapshot does not prove the exact cause of that response.
- Explain bounce return limitations, fees and inactive-recipient behavior using
  accessible description, while keeping the default false and label stable.
- Replace global “fees not calculated” assertions with scoped descriptions of
  what balance/part-plan checks do; reserve current-cost claims for QuoteView.

## Execution

1. RED tests: unsupported capacity has its actual value without uploading;
   UNINIT explains lack of deployment; backend rejection has honest guidance;
   bounce has an accessible safety explanation; RU/EN editor→prepare→quote
   flow has no global uncalculated-cost assertion after success.
2. GREEN minimal changes in QuotePanel, BalancePanel, RecipientEditor and typed
   catalog. No invented diagnosis and no lifted/shared fee state.
3. Update docs/product and run focused tests, full npm run check and diff checks.
   Review full branch once; fix material findings with tests.
4. Record results/remaining gates in PLAN/HANDOFF. Commit locally with Husky.
   No push/PR/merge/deploy, hosting badge/cloud changes or real transfers.

Ruling: do not infer wallet code/version from TON Connect application name or
ACTIVE status. Cost: unsupported backend response remains a documented combined
cause until a separately designed public error contract distinguishes it.

## Execution results

- Eight focused regressions observed RED for the intended missing guidance and
  stale footer; GREEN after minimal view/catalog changes. Existing balance copy
  assertion updated to the new scoped explanation. Added EN state/error/capacity
  coverage and a RU-to-EN editor→prepare→quote integration with two explicit
  requests, preserved exact result and no sending control.
- Full npm run check PASS290tests/27files, API drift, lint, formatting, types,
  production build and install metadata. Existing >500kB Vite warning remains.
- Independent whole-branch review: Critical0/Important0/Minor1 corrected (EN
  regression assertion now checks actual previous text and positive new copy).
  Focused integration rerun PASS after correction; final Husky runs full tests.
- No live browser/device or CI/cloud verification claimed. Publication, physical
  comma/expiry/recalculate checks and worker CPU/RSS/timeout gates remain open.
