# Recipient Editor Implementation Plan

> **For agentic workers:** Use executing-plans inline, TDD per task and one fresh whole-branch review. No worktrees.

**Goal:** Prepare, validate, import/export and save native TON recipient lists without sending.
**Architecture:** Reusable controlled recipient editor in public memory and private drafts; pure exact-money/address/CSV functions; existing owner-isolated CAS API.
**Tech stack:** React/Radix/CSS Modules, BigInt, native browser address decoding, pinned Papa Parse.
**Spec:** ../specs/2026-10-27-recipient-editor-design.md

## Global constraints

Native TON testnet only, no signing/transfers/fee estimates. Max200 rows,128 address/amount code points,500 comment;256KiB import and64KiB server JSON. No implicit local persistence, server upload or private-to-public data copy. Preserve unfinished strings and CAS/identity isolation. User owns push/PR/merge.

## Review focus

- Malformed raw addresses and friendly checksum/flag variations must not bypass validation; compare canonical addresses for duplicates.
- Huge/ambiguous monetary input, more than9 decimals and editing after preview must never round or retain stale approval.
- CSV quoting, headers, delimiters, formula injection, truncation and over-limit append must be explicit and atomic.
- Conflict, logout during save/import and switching drafts must retain or discard data intentionally and never expose another identity.
- Public preparation must work at360px without auth/network, and dialog keyboard focus must return predictably.

## Task1: Pure input and CSV functions

Files: src/features/recipients/{validation,csv}.{ts,test.ts}, package.json/lock, docs/csv-format.md.
Interfaces: validateRecipients(DraftRecipient[]) returns rows with error/warning strings, canonical address and bigint total; parseAmount/formatAmount convert exact decimals; parseCSV returns recipients or actionable record error; exportCSV returns spreadsheet-safe string.

- [x] Write failing tests for nanotons/limits/format, address variants/CRC/raw/duplicates and CSV quoted/BOM/header/malformed/size/formula/field limits.
- [x] Run focused tests and observe missing-module RED; install pinned Papa Parse and types, implement bounded pure functions.
- [x] Run focused tests GREEN; cross-check golden addresses with existing Go TON library; document format and export safety.
- [x] Commit validated Task1 with enabled Husky.

## Task2: Reusable local editor and CSV review

Files: src/features/recipients/{RecipientEditor,RecipientFields,CsvImport,PublicWorkspace}.tsx, Editor.module.css and component tests; src/main.tsx.
Interfaces: RecipientEditor value/onChange/disabled controlled DraftRecipient[], shared public/private. PublicWorkspace never calls APIs, warns before losing unsaved state and exports explicitly. CsvImport validates into staging; append/replace commits one state update.

- [x] RED tests for local add/edit/remove, amount precision/error, duplicate acknowledgement, preview invalidation, CSV staged import/append limits and explicit replacement.
- [x] Implement mobile cards/desktop columns, Radix detail dialog, toolbar/import/demo/export and exact preview.
- [x] GREEN tests and browser360/390/768/1280, keyboard focus, no runtime exceptions. No fee/signature assumptions.

## Task3: Durable private recipients and final verification

Files: src/features/drafts/DraftWorkspace.tsx/tests, shared input bounds as needed, docs/reviews.
Interfaces: DraftEditor onSave(name,recipients), existing PUT with unchanged version/name/rawstrings. Local dirty state retained on409 until explicit reload; logout unmount clears private data.

- [x] RED tests for changed recipients in PUT, incomplete precision preservation, conflict edits, oversized JSON, unsaved switching/reload confirmation and logout during save.
- [x] Implement controlled reusable editor, explicit full-save success and64KiB guard; keep name-only existing tests and lifecycle guarantees.
- [x] Run full npm check/audit and inspect real browser UI. Obtain fresh review, fix important issues with RED/GREEN, commit. Update root PLAN/ledger and report stage2A completion and remaining fee/wallet capability work. Do not push/merge or deploy new feature without current instruction.
