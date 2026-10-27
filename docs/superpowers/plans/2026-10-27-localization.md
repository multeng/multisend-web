# RU/EN Localization Implementation Plan

> **For agentic workers:** Use executing-plans inline, TDD and one fresh whole-branch review. No worktrees.

**Goal:** Switch the entire current app between Russian and English without losing work.
**Architecture:** Typed source-message catalog, React locale context, safe preference storage, translated rendered messages and SDK option updates.
**Tech stack:** Existing React/TypeScript/Radix. No new dependencies.
**Spec:** ../specs/2026-10-27-localization-design.md

## Constraints and review focus

Exactly ru/en; fallback en; decimal/CSV/API format unchanged; only locale preference persisted. Switching must preserve unsaved editor/dialogs/session/query identity, errors already visible must update and storage failures must not break startup. Native browser/wallet-app dialogs are outside app translations. No push/merge/deploy.

## Task1: Locale core

- [x] Add failing locale selection/storage, DOM metadata and switching tests. Implement typed translation catalog, provider and selector with Russian default outside provider for existing component isolation.
- [x] Verify saved preference wins over browser, invalid/blocked storage falls back safely, both directions and no unexpected persistence; commit with enabled Husky.

## Task2: Entire interface and wallet language

- [x] Add failing integration tests for English editor/errors and switching while editing without losing strings or submitting requests.
- [x] Translate current components and error rendering; interpolate record/count messages, update document metadata and TON Connect options without recreating connector. Preserve user data and decimal/CSV semantics.
- [x] Run full npm check/audit and real Edge mobile/desktop, inspect screenshots. Fresh review; fix important findings with failing regressions then whole suite. Commit, update root roadmap and report.
