# Private Draft Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task.

**Goal:** Create and restore private testnet drafts through the public JSON API.
**Architecture:** Verified auth identity → private TanStack reads/native fetch writes → optimistic server versions.
**Tech Stack:** Existing React/TypeScript/Radix/Zod/TanStack/HeyAPI, no new dependencies.
**Spec:** `../specs/2026-10-27-private-drafts-design.md`.

- [x] Copy OpenAPI0.3.0 public snapshot and generate DTOs independently of backend.
- [x] Write failing draft API/key and shell behavior tests; implement validated transport and authenticated shell. Cover exact amounts, rename/conflict/delete confirmation and logout during pending save.
- [ ] Run npm run check, browser smoke and fresh cross-repository review; fix important findings and commit. Keep real wallet/device/HTTPS/remote CI limits explicit.
