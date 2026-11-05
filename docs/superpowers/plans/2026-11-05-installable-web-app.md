# Installable web app implementation plan

> **For agentic workers:** Use executing-plans and test-driven-development inline. Owner approved the preceding minimal PWA proposal and asked to continue; no repeat design approval.

**Goal:** Install the existing web client on Android/iOS and explain installation in RU/EN before real mobile-wallet testing.
**Architecture:** Static web app manifest/icons and a small progressively enhanced install disclosure. Existing React/Vite/auth/Query stack; no service worker, offline cache, background sync, dependencies or backend changes.
**Spec:** Owner-approved PWA proposal in conversation; existing parent PLAN/HANDOFF invariants. Browser references: [installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [install prompt](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent).

## Constraints and decisions

- Base web main71e121f, new feature/add-installable-web-app; merged backend mainbf9fc37 unchanged. Both merged trees equal reviewed feature commits. No worktree/push/PR/merge/deploy/cloud changes.
- Manifest /manifest.webmanifest: stable id/start_url/scope '/', standalone, existing name/theme,192/512 PNG icons and512 maskable; apple-touch-icon180. Icons rasterize existing favicon SVG with safe padding, no new logo/dependency.
- Install UI uses semantic details/summary, manual Android/iOS instructions always available in browser; native install button only after a supported beforeinstallprompt event. Prompt only on click, consume once, handle failure/dismissal, hide after appinstalled or standalone detection (including navigator.standalone on iOS). No device-UA assumptions.
- Standard browser network/cache behavior remains; no service worker or private API cache/replay. PWA launch does not authenticate users or change payment/quote invariants. Expired quotes retain existing monotonic timer/focus/visibility checks.
- Foreground session recheck: read-only session refresh on return from hidden state, skip login/proof operations, deduplicate checks and discard stale response after logout/account change. Preserve editor/session on same identity success; clear private cache and require re-entry on revoked/changed session. On unavailable checks retain editing and show an error; protected server actions still enforce authorization. Never replay writes or invoke a wallet from foreground event. No re-authentication by connected wallet alone.
- Native app stores, offline editor/push notifications, durable attempts/transfers are out of scope. Real install/wallet deep-link roundtrip remains a physical-device gate after separately authorized HTTPS deployment.

## Review focus

- Unsupported browsers still show useful instructions; missing prompt cannot look installed.
- Dismissal/rejection, double-click and appinstalled/standalone events never replay a consumed prompt or leave unhandled promises/listeners.
- Published manifest/icon paths resolve from built HTML, with correct dimensions and maskable safe area; TON Connect manifest remains independent.
- Return from wallet/background cannot revive a revoked/foreign session or obsolete estimate, or destroy same-identity editing unnecessarily.
- RU/EN320px layout/keyboard/disclosure focus; no automatic financial uploads/caching or misleading offline support.

### Task 1: Static install metadata and icons

Files: public/manifest.webmanifest, public/icons/*.png, index.html; scripts/check-install.mjs, package.json.

- [x] Verify baseline frontend tests. Validate actual production build metadata/served JSON, icon headers/dimensions and safe routes through real tooling (no source-text tests).
- [x] Add manifest/HTML links, rasterize existing SVG, build and verify artifact consistency. No service worker.

### Task 2: Install UI

Files: src/features/install/InstallApp.tsx/.module.css/.test.tsx; src/app/App.tsx; i18n/catalog.ts.

- [x] RED manual RU/EN fallback, explicit-only prompt/once, rejection/dismissal/installed/standalone/cleanup.
- [x] GREEN minimal component, mount in app; run focused tests.

### Task 3: Foreground session and verification

Files: auth/controller.ts/.test.ts; AuthProvider.tsx (visibility wiring).

- [x] RED return/session identity, revoke/unavailable, stale responses after logout, no check during proof; preserve editing on valid unchanged session.
- [x] GREEN bounded read-only refresh through existing client; foreground event only after hidden state, cleanup/dedup.
- [x] Full npm run check with build metadata verification, synthetic browser/mobile install UI/standalone/quote-expiry checks; fresh independent review once. Fix material findings through RED/GREEN; update reviews/README/PLAN/HANDOFF and commit with Husky enabled. Report real-device/HTTPS/cloud gates separately.

## Execution record

- Fresh fetch/status clean; web origin/main71e121f tree equals41b585b, API origin/mainbf9fc37 tree equals59cbb3b. Local mains fast-forwarded, backend unchanged. No user changes overwritten.
- Ruling: network failure on resume preserves local editing and reports uncertainty instead of resetting the editor; existing protected endpoints remain the authorization boundary. Cost: freshness is not confirmed until another successful server check. Installation disclosure follows the main workspace/status, keeping primary keyboard workflow intact.

- Baseline258tests PASS; install/controller RED→GREEN and provider visibility checks PASS. Independent review Critical0/Important0/Minor1 addressed with live display-mode transition regression. Browser production manifest/mobile QA PASS; native install/wallet/deploy remain external gates.
