# TanStack Query and contributor checks

Date: 2026-10-27. Scope authorized by the user's request to connect TanStack Query and add pre-commit lint/tests. Routine implementation choices below are the implementer's decisions, not additional product requirements.

## Intent and approaches

Replace the readiness component's manual request state with TanStack Query while preserving its visible behavior, cancellation, latest-result protection and 10-second deadline. Add useful commit-time feedback without introducing application features.

The user selected TanStack Query + native fetch after discussion. Keeping manual effects would duplicate request lifecycle code; adding Axios or another transport library brings no present benefit. For commit checks, choose Husky + lint-staged for staged lint/format checks, then full typecheck and unit tests. Running a production build on every commit is unnecessary; it remains in CI and `npm run check`.

## Design

- One QueryClient for the running SPA, with a factory for isolated tests. Queries and mutations have automatic retry disabled by default. Focus/reconnect refetching is disabled by default and can be enabled deliberately for future read-only screens.
- Readiness uses key `['api', 'readiness']`, no retained inactive cache (`gcTime: 0`), no freshness interval (`staleTime: 0`), and `networkMode: 'always'` so an offline browser does not leave the initial query paused forever. No cache persistence or offline mutation queue is added.
- Pass Query's AbortSignal through the HTTP boundary. HTTP client owns a cancellable 10-second deadline covering fetch and body parsing; a stalled transport must settle even if it ignores abort. Clean up timers/listeners. Query manages component lifecycle and late-result rejection.
- Keep HTTP status/body validation: only 200/ready and 503/not_ready are accepted. Error/loading text and accessible retry remain unchanged. Retrying explicitly cancels an existing query before refetching, including the first pending request.
- Add `@tanstack/eslint-plugin-query` recommended rules to the existing flat config.
- Husky installs local hooks through `prepare`. `.husky/pre-commit` runs `npm run precommit`: lint-staged read-only ESLint/Prettier checks, then whole-project typecheck and all unit tests. No auto-format/fix in the hook. `npm run format` remains explicit.
- Track hook source with LF; ignore Husky's generated `.husky/_/`. Set `HUSKY=0` in CI because CI runs the authoritative full checks directly. Document Git hooks' local/bypassable nature and the need to install dev dependencies.
- No backend changes, push, PR, merge, custom HTTP framework, router, state manager, forms or payment logic. Work in `feature/add-tanstack-query`, no worktree.

## Dependency decisions

Install exact verified versions of TanStack Query, Query ESLint plugin, Husky and lint-staged. Already present: ESLint, Prettier, Vitest, Testing Library. Consider schema validation (Zod), form state (React Hook Form), CSV parsing (Papa Parse), TON Connect and browser automation (Playwright) when their actual screens/contracts are implemented. They are not installed in this task. Monetary parsing will remain exact and is not delegated to floating-point utilities.

## Acceptance

- Existing readiness states, keyboard retry, cancellation and timeout continue to work; new tests cover shared-request deduplication, disabled automatic retries and manual refetch after an error.
- Timeout covers a stalled response body and transport ignoring abort; pre-aborted calls do not issue a request.
- Real `npm ci`, `npm run check`, audit, staged checks and a real successful commit through Husky run locally. Demonstrate lint-staged rejects a deliberately invalid staged file in an isolated temporary Git repository, without changing this repository's source/index to manufacture failure.
- Local browser check covers readiness error/retry/synthetic success and unchanged layouts. Remote Actions is pending until a separately authorized push.
