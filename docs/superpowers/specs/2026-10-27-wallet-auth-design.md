# Testnet wallet login

Authenticate using a server-issued, browser-bound TON proof. Connecting or restoring a wallet is insufficient. The public contract is `api/openapi.yaml` v0.2.0; the private backend is not needed for frontend checks or builds.

Use native fetch with same-origin HttpOnly cookies, CSRF, cancellation and a 10-second deadline including response parsing. Validate unknown responses with Zod. Generate TypeScript DTOs from the committed OpenAPI snapshot using the locked HeyAPI version; `api:check` is read-only. Never store application session tokens in JavaScript storage.

Before login, reset the existing family with logout and fetch a fresh session, then obtain a challenge before opening TON Connect. Verify only the current challenge, wallet and testnet network. Clear private Query cache immediately on logout or account/network change; discard late responses using cancellation and a generation guard. Reconcile SDK restoration before exposing persisted server authentication. Authentication lifecycle is kept in one observable controller; private server resources use TanStack Query. This avoids competing query refetches during proof/session rotation.

Configure `VITE_PUBLIC_SITE_URL` only after a public HTTPS origin exists. Vite emits `/tonconnect-manifest.json` with the application name and a local 180px PNG icon. Missing configuration disables login with an explanation. TON Connect analytics is explicitly off. No hosting or real wallet approval is part of local implementation.

Acceptance: transport rejects malformed responses, cancellation and deadlines; tests exercise challenge ordering, reset/retry, restoration, logout during verification and account/network switching. Existing readiness behavior stays covered. Real wallet/device approval requires later HTTPS testing.
