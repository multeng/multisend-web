# Private Draft Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task.

**Goal:** Create and restore private testnet drafts through the public JSON API.
**Architecture:** Verified auth identity → private TanStack reads/native fetch writes → optimistic server versions.
**Tech Stack:** Existing React/TypeScript/Radix/Zod/TanStack/HeyAPI, no new dependencies.
**Spec:** `../specs/2026-10-27-private-drafts-design.md`.

- [x] Copy OpenAPI0.3.0 public snapshot and generate DTOs independently of backend.
- [x] Write failing draft API/key and shell behavior tests; implement validated transport and authenticated shell. Cover exact amounts, rename/conflict/delete confirmation and logout during pending save.
- [x] Run npm run check, browser smoke and fresh cross-repository review; fix important findings and commit. Keep real wallet/device/HTTPS/remote CI limits explicit.

Verified: npm run check50tests, npm audit0, local configured manifest build and180pxPNG; enabled Husky precommit. Native Edge360/390/768/1280 showed synthetic authenticated list/open/logout without horizontal overflow or runtime exceptions. Fresh cross-repository review completed; backend escaping/recipient-null findings fixed and rechecked. Unicode response bounds already count code points, verified with120emoji names and500emoji comments; no schema change required. Private shell is not the full CSV/editor stage. HTTPS real-wallet approval and remote CI remain pending.
