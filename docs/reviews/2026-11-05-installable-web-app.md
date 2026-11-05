# Installable web app review

Base71e121f; branch feature/add-installable-web-app. Merged quote trees verified: web71e121f equals41b585b and APIbf9fc37 equals59cbb3b. Backend unchanged, no dependencies, service worker, cache persistence, background sync, wallet invocation, financial operations, cloud changes or deployment.

## Verification

- Baseline258tests PASS. Install UI stub RED then GREEN: manual RU/EN instructions, supported browser event interception, explicit-only/once prompt, rejection fallback, appinstalled and standalone/iOS launch, unmount cleanup. Installed browser modes hide installation UI; no user-agent guessing.
- Foreground controller tests RED then GREEN: same identity preserves editing, revoked/foreign sessions clear private state, failures report uncertainty without clearing local editing, checks deduplicate, late replies after logout are canceled/discarded, pending login/proof untouched. Provider integration verifies one GET session/no-store on hidden→visible, no request on ordinary focus/visible events and listener cleanup.
- Production artifact validator observed RED on prior built HTML without manifest, then GREEN after actual build. Checks HTML links, manifest id/start/scope/display and referenced PNG dimensions192/512/180. Existing SVG rasterized in local browser canvas with opaque background and central glyph within maskable safe circle;512px visually inspected. TON Connect manifest remains independent.
- Full npm run check PASS271tests/26files including API drift/lint/format/types/unit tests/build/install:check. Existing Vite >500kB wallet/main chunk warning remains; no chunking changes. No backend tests rerun in this frontend-only block.
- Actual local production build in Edge: Page.getAppManifest parsed without errors,0 service-worker registrations; RU/EN320/360/390/768/1280px without overflow, summary>=44px/focus; explicit synthetic install once, appinstalled hides UI, synthetic iOS standalone launch hides UI;0 runtime exceptions. RU/EN390px screenshots inspected.
- CDP display-mode emulation did not change Edge's media query; this failed harness assumption is not a passing native standalone test. Replaced browser scenario with explicitly synthetic navigator.standalone; unit tests separately exercise live MediaQueryList changes. No claim of actual Android/iOS installation or wallet roundtrip.

## Independent review

Fresh read-only reviewer: Critical0 / Important0 / Minor1. Independently reran23focused tests, install validator and diff check PASS. Minor coverage gap addressed by a new test changing the existing media.matches and dispatching change. No production behavior changed by review follow-up; no deferred PWA findings.

## Rulings and limits

- A temporary unavailable session check preserves prior local editing, shows an error and does not assert fresh authorization. Every server action still passes existing session middleware. Revocation/identity changes remove private state and require login. Cost: freshness remains unknown until a successful server check; no financial operation is replayed.
- Installation disclosure follows primary workspace/status actions to preserve keyboard workflow and avoid displacing the editor. Native install event is an enhancement; manual instructions remain available.
- Reviewer set aside physical-device installation/wallet return, deployed hosting headers/routing, native keyboard behavior and backend enforcement. Browser layout/focus checked separately; all device/deployed gates remain before pilot. No remote CI, native app-store package, full offline support or deployed availability claim.
- Existing quote expiry, V4R2/200rows/native-v1 and no-send invariants unchanged. Prior backend composition/XFF coverage minors remain historical follow-ups, not resolved by PWA.
