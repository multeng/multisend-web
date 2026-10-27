# Testnet frontend on Netlify

The stable application origin is `https://multisend-testnet-multeng.netlify.app`. Netlify serves only this public frontend; `/api` requests are proxied with the full path to the Go service on Render. PostgreSQL credentials belong exclusively to the Go service. The public TON Connect manifest and180pxPNG are generated/served at the same origin and allow cross-origin reads without cookies.

`netlify.toml` records the pinned Node/npm versions, static build directory, API proxy and testnet noindex headers. API/auth/private cache policy comes from the backend's `Cache-Control: no-store`; do not add cache rules or wildcard credentialed CORS to API routes. Deploy Previews do not share the configured exact production auth origin and are not a separate authenticated environment.

Initial deployment can use a locally checked build with the authenticated Netlify CLI. Build with VITE_PUBLIC_SITE_URL set to the stable origin, then publish dist to the linked site. `.netlify/` is local CLI state and ignored. The hosting word “production” means publishing to the stable site's URL; the application and funds remain testnet-only.

After the owner's PR merge, Git integration can build from main. Keep deployment changes reviewable and do not publish older branches over an intentionally deployed version. Before publishing, verify the actual Render service URL matches both proxy targets; Render may allocate a suffix if the requested hostname is unavailable.

Verify manifest JSON, PNG180x180, HTTPS and CORS; health/readiness/session/challenge/logout through the Netlify origin; Secure HttpOnly cookie, rejected foreign Origin/missing CSRF, private401 and no-store. Do not interpret these checks as a real wallet approval or payment. Free Render cold starts can exceed the client's ten-second deadline; open readiness and retry login after startup rather than automatically replaying proof or payment actions.

## Verified deployment: 2026-10-27

The stable site is live. Its exact API target is `https://multisend-api-testnet.onrender.com`, confirmed as the dedicated Free service before publication. The initial manual deployment contains the wallet login and private drafts implementation on `chore/deploy-testnet`; Git continuous deployment is not connected yet.

Live HTTPS checks passed for readiness, isolated anonymous sessions, Secure/HttpOnly host cookies, challenge/logout, Origin/CSRF rejection, private drafts returning401, no-store and public wallet metadata. Edge verified360/390/768/1280px layouts, browser session access and the real TON Connect wallet selection modal with no runtime exceptions. A real wallet signature and authenticated draft workflow remain to be checked on a device. The full frontend check passed50 tests; local Husky remains enabled.
