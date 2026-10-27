# Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a reproducible, responsive frontend foundation with honest API readiness feedback.

**Architecture:** React renders a static SPA; a small HTTP client validates readiness responses. Vite proxies relative `/api` requests locally; production hosting must provide the corresponding reverse proxy. No backend implementation is included.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Radix Themes, CSS Modules, Vitest, Testing Library, ESLint, Prettier, npm lockfile.

**Spec:** `../specs/2026-10-27-local-foundation-design.md` (frontend subset approved by the user's instruction to start frontend on 2026-10-27).

## Global Constraints

- Work in `feature/add-base-structure`, in place, without git worktree. User handles PR and merge; no push in this task.
- Empty `master` has only a bootstrap commit, providing the future PR base.
- React/TypeScript/Vite, Radix Themes and CSS Modules; no Tailwind or Next.js.
- Node 24.22.1 and npm 11.19.1; exact dependencies and committed lockfile. TypeScript 6.0.3 satisfies typescript-eslint's `<6.1.0` peer range.
- Host `127.0.0.1:5173`, strict port; dev proxy defaults to `http://127.0.0.1:8080`.
- No wallet, signing, CSV editor, authentication, analytics, private API source or secrets in this public repository.
- Unit tests prove HTTP and UI behavior; configuration is verified through real checks, not file-existence tests.

## Review Focus

1. Production static hosting must route `/api` separately; Vite proxy does not ship in `dist` (documentation/reviewer).
2. React StrictMode effect cleanup and a transport that resolves despite cancellation must not overwrite current state (component tests/reviewer).
3. A server that never completes its response must not leave checking forever (timeout test/reviewer).
4. At 360/390/768/1280 px, long status copy and keyboard focus must remain usable (browser QA).
5. CI for the public repo must not require private backend checkout, deployment credentials or write permissions (workflow review).

## Files

- `package.json`, `package-lock.json`, `.nvmrc`, `.npmrc`: supported runtime, scripts, reproducible dependencies.
- `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc.json`: build and checks.
- `index.html`, `public/favicon.svg`, `src/main.tsx`, `src/styles.css`: app entry, system typography, theme.
- `src/api/readiness.ts`, `src/api/readiness.test.ts`: validated HTTP boundary.
- `src/app/App.tsx`, `src/app/App.module.css`, `src/app/App.test.tsx`, `src/test/setup.ts`: responsive app and interaction tests.
- `.gitignore`, `.gitattributes`, `.editorconfig`, `.env.example`, `AGENTS.md`, `README.md`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`: repository workflow and documentation.

## Task 1: Runtime and readiness client

**Interfaces:** Produce `getReadiness(signal: AbortSignal): Promise<'ready' | 'not_ready'>`. Request `/api/readyz`, `cache: 'no-store'`; only accept HTTP 200/status ready or HTTP 503/status not_ready. Throw on all other HTTP/body/network outcomes. Caller owns cancellation and timeout.

- [ ] Add package/configuration/ignore files and install exact compatible versions. Expected: dependency resolution succeeds and lockfile is created.
- [ ] Write HTTP tests for ready, not_ready, unexpected HTTP, invalid JSON/body/status, network failure and signal forwarding.
- [ ] Run `npm.cmd test -- src/api/readiness.test.ts`. Expected: failure because client is absent.
- [ ] Implement the smallest validating client and rerun. Expected: all client cases pass.
- [ ] Commit `feature: add frontend tooling and readiness client` with plan/spec.

## Task 2: Responsive application

**Interfaces:** Consume `getReadiness(signal)`; UI states checking/ready/not_ready/error. Abort previous request on retry/unmount, ignore stale results, timeout after 10 seconds, retain retry button keyboard access. No data persistence.

- [ ] Write component tests for checking, each settled state, retry recovery, stale completion, unmount cancellation and timeout.
- [ ] Run `npm.cmd test -- src/app/App.test.tsx`. Expected: failure because App is absent.
- [ ] Implement page, theme and responsive CSS. Expected: component tests pass.
- [ ] Run `npm.cmd run check` (lint, formatting, typecheck, tests, build). Expected: all pass.
- [ ] Commit `feature: add responsive application shell`.

## Task 3: Contributor workflow and validation

**Interfaces:** README/AGENTS/CI all invoke the same package scripts. CI uses Node from `.nvmrc`, npm ci and `npm run check` without backend access. Only read permissions.

- [ ] Write contributor docs, environment example, PR template and GitHub Actions workflow; pin official action commit SHAs verified from official repositories.
- [ ] Run `npm.cmd ci`, `npm.cmd run check`, `npm.cmd audit`; inspect actual results.
- [ ] Start Vite, verify HTTP and Edge browser layouts at four widths, keyboard focus and API-down/retry behavior. Keep QA artifacts outside tracked source.
- [ ] Update root roadmap: frontend locally checked, backend and remote CI pending; preserve remaining stages.
- [ ] Commit `chore: add contributor workflow and CI`.
- [ ] Obtain one fresh read-only whole-branch review against `master`; fix important findings with regression tests and rerun checks.
- [ ] Leave branch in place for user PR/merge and report actual checks and limitations.

## Plan self-review

The three tasks cover client, application and delivery independently. HTTP and UI signatures agree; no backend or product feature is implied. Review focus has explicit automated/manual ownership. Configuration checks use existing tools, and no generated abstractions or deployment infrastructure are introduced.
