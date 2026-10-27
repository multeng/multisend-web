# Query and Hooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Adopt TanStack Query for readiness and install practical commit-time checks.

**Architecture:** QueryClientProvider wraps the app; query options compose the existing validated fetch client. The client owns the deadline and Query owns cache/lifecycle. Husky runs staged lint/format checks followed by types and tests; CI remains authoritative.

**Tech Stack:** Existing React/TypeScript/Vite, TanStack Query 5.105.0 and Query ESLint plugin 5.105.0, Husky 9.1.7, lint-staged 17.6.0 (versions/peers checked in npm).

**Spec:** `../specs/2026-10-27-query-and-hooks-design.md`.

## Global Constraints

- Branch `feature/add-tanstack-query`, base `main` at `5e0ecae`; no worktree, push or merge.
- Node 24.22.1/npm 11.19.1, exact dependencies and lockfile; public frontend must not access private backend.
- Preserve readiness URL, HTTP/body validation and all visible states. No product redesign or new payout functionality.
- Signal cancellation must reach fetch; deadline is 10,000 ms and covers parsing too.
- No automatic retries, cache persistence, offline queue or wallet operations.
- Keep hooks readable, LF, compatible with Git for Windows; no app/test code is added merely to inspect configuration.

## Review Focus

1. First pending refetch must really cancel, despite Query's default deduplication (App interaction test).
2. Transport ignores abort or body parsing stalls: timeout still settles and late completion cannot overwrite state (HTTP/component tests).
3. Query shared by two observers must deduplicate, and unmounting one must not cancel the other (hook integration tests).
4. Commit checks must handle spaces in paths, failed commands and clean staging without editing the user's files (isolated Git hook probe).
5. Hooks must install on clean npm ci locally, while CI skips hook installation and runs full checks (clean install/manual workflow review).

## File map

- Modify `src/api/readiness.ts` and `.test.ts`: request deadline/cancellation, preserve validated result type.
- Create `src/app/query-client.ts`: `createQueryClient(): QueryClient` with deliberate defaults.
- Create `src/api/readiness-query.ts` and `.test.tsx`: reusable `readinessQueryOptions`, query lifecycle integration tests.
- Modify `src/app/App.tsx`, `.test.tsx`, `src/main.tsx`: use query/provider, no manual effect lifecycle.
- Modify `package.json`, lockfile, `eslint.config.js`, `.gitignore`, `.github/workflows/ci.yml`, README, AGENTS; create `.lintstagedrc.json`, `.husky/pre-commit`.
- Root `PLAN.md`: actual result and next dependency candidates, not completion of backend or payment milestones.

## Task 1: Query lifecycle migration

**Interfaces:** Keep `getReadiness(signal: AbortSignal): Promise<'ready' | 'not_ready'>`; add factory `createQueryClient()` and `readinessQueryOptions` for key `['api', 'readiness']`. App derives checking/ready/not_ready/error from query state and cancels before manual refetch.

- [x] Add exact Query and plugin dependencies; install. Expected: peers resolve, lockfile updated.
- [x] Extend HTTP tests for pre-abort, timeout of fetch/body, late result and listener/signal behavior. Run `npm.cmd test -- src/api/readiness.test.ts`. Expected: new tests fail before implementation.
- [x] Implement deadline/cancellation in the HTTP client; rerun targeted suite. Expected: passes.
- [x] Add query integration tests: dedup two observers, one-unmount preservation, no retry, last-unmount cancellation and remount freshness. Run targeted suite. Expected: missing query exports fail.
- [x] Implement client factory/query options; rerun. Expected: passes.
- [x] Adapt App tests to a fresh real QueryClient per test and async refetch; retain UI scenarios and add no-retry behavior. Wire provider in tests first. Run targeted suite. Expected: no query in provider/cache proves migration is still missing.
- [x] Replace component effect/state with useQuery; wire a stable provider in main, add Query ESLint rules. Run `npm.cmd run check`. Expected: all pass.
- [x] Commit `feature: manage readiness with TanStack Query`.

## Task 2: Commit checks and contributor docs

**Interfaces:** `npm run precommit` invokes `lint-staged && npm run typecheck && npm test`; `.husky/pre-commit` invokes that script; `prepare` installs Husky. Existing `check` remains unchanged. CI sets `HUSKY=0`.

- [x] Add Husky/lint-staged exact dependencies, package scripts, read-only staged config and LF hook; install. Expected: hooksPath points to generated `.husky/_`, generated files remain ignored.
- [x] Document Query policy, precommit commands, hook installation/CI distinction, dependency candidates and limitations in README/AGENTS and root roadmap.
- [x] Validate a deliberately invalid staged file with spaces in an isolated temporary Git repo using the installed tools; ensure rejection, then valid file passes. Expected: no main checkout/index modifications.
- [x] Stop any Vite process using this repo before `npm.cmd ci`, then run clean install, `npm.cmd run check` and `npm.cmd audit`. Expected: installation/checks pass; investigate audit output.
- [x] Start Vite and run native Edge QA against actual app, with synthetic responses clearly distinguished from Go integration. Expected: four widths, focus/retry and zero runtime exceptions pass.
- [x] Stage this task's files and commit through the actual installed pre-commit hook. Expected: staged lint/format, typecheck and unit tests run and succeed.
- [x] Obtain a fresh read-only whole-branch review; address important findings with meaningful regression tests, then final checks.
- [x] Leave local branch ready for user PR/merge; do not push.

## Plan self-review

Scope is limited to the existing readiness path and developer workflow. HTTP result types and query options agree across tasks. Each review focus has concrete verification; configuration uses real tools, not mirrored tests. Existing UI is preserved and future dependencies remain recommendations only.

## Verification result

Implemented locally on the feature branch. Clean npm ci and audit passed (0 known vulnerabilities); npm run check passed 32 tests, lint, formatting, types and build. Real hooks rejected deliberate lint/format defects in an isolated Git fixture and accepted a valid file; the repository commit also ran through Husky. Edge QA passed four widths and keyboard/retry states, including a repeat with AbortSignal.any unavailable. Review found one browser compatibility regression; two regression tests failed first and passed after replacing signal composition with a cleaned-up forwarding listener. No unresolved findings. Backend integration, real devices/wallets and remote CI for this branch remain unverified.
