# TON Multisend Web

Responsive frontend for preparing wallet-signed TON payouts. Public repository; the backend is maintained separately in a private repository.

Current scope: application foundation, responsive start page and API readiness check. Recipient editor B, CSV import, authentication, server history and wallet signing belong to later stages. The current application cannot send funds.

## Requirements and quick start

- Node.js **24.22.1** (`.nvmrc`); supported range `>=24.22.1 <25`.
- npm **11.19.1**; supported range `>=11.19.1 <12`. CI uses this exact version.

Run from this repository:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. On Windows PowerShell, use `npm.cmd` in place of `npm` when script execution policy blocks `npm.ps1`. No backend, Docker or database is required to build or test the frontend. With the backend stopped, the page shows an API connection error and allows retry.

The dev server binds to loopback and fails if port 5173 is occupied. A phone cannot reach the computer using its own `localhost`; real-device network access will be configured separately when wallet flows are tested.

## API configuration

The browser requests relative `/api/readyz`. The Vite **development server** proxies `/api` to `http://127.0.0.1:8080`. Override the target by copying `.env.example` to `.env.local` and changing `API_PROXY_TARGET`, then restart Vite. This server-only variable must not contain credentials. Never place secrets in `VITE_*`: those values can become public browser code.

Expected readiness contract:

| HTTP                                     | Body                     | Result                         |
| ---------------------------------------- | ------------------------ | ------------------------------ |
| 200                                      | `{"status":"ready"}`     | Server ready                   |
| 503                                      | `{"status":"not_ready"}` | Server reachable but not ready |
| Other, invalid JSON or unexpected status | Any                      | Connection/contract error      |

Checks are uncached, cancelled on retry/unmount and time out after 10 seconds. API readiness does not imply that payout functionality is available. Tests use synthetic responses; they do not claim integration with the future Go API. Its canonical versioned OpenAPI contract will live in the backend repository.

## Development checks

```sh
npm run check
```

Runs ESLint, Prettier check, strict TypeScript checks, Vitest and a production build. Individual commands: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test`, `npm run build`. Use `npm run format` to apply formatting and `npm run test:watch` during development.

Behavior tests cover readiness validation, errors, retry recovery, late responses, StrictMode cleanup and timeouts. Browser checks at 360, 390, 768 and 1280 px supplement these tests; real phones and wallets require separate validation.

```sh
npm run build
npm run preview
```

Build output is `dist/`. Preview listens at **http://127.0.0.1:4173** and is for inspecting static output locally, not production hosting. **The dev API proxy is not part of `dist/` or the preview server.** Production hosting must route `/api/*` to the backend on the same origin, without rewriting those requests to `index.html`. No deployment is configured yet.

## Project structure and workflow

- `src/app/`: application shell, CSS Module and component tests.
- `src/api/`: small validated HTTP client and contract tests.
- `src/test/`: shared test setup.
- `docs/superpowers/`: current design and implementation plan.
- `AGENTS.md`: contributor and coding-agent rules.

React + TypeScript + Vite, Radix Themes and CSS Modules; system fonts and no Tailwind. The blue styling is an independent project theme, not an official TON/Telegram affiliation. Radix supplies shared component styles; optimize asset weight against measurements as real screens are introduced.

Use separate branches such as `feature/add-base-structure`, `fix/readiness-timeout`, `chore/update-dependencies` and `docs/update-readme`. Work in the existing checkout without git worktree. Keep changes reviewable, run the checks and open a PR to the repository's default branch. The user handles PR creation and merge in this workflow.

Dependencies are pinned and `package-lock.json` is committed. Use `npm ci` for clean installs. Review dependency updates and audit results; do not run automatic breaking upgrades. Do not commit `.env.local`, recipient lists, credentials, wallet keys, build output or QA artifacts. A public repository does not imply a chosen open-source license; choose licensing before public distribution/pilot.

GitHub Actions runs the same checks for pushes and PRs with read-only permissions and no private backend access. A locally passing check is separate from a successful remote Actions run; the latter can only be reported after an actual push and run.
