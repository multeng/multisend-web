# Working on multisend-web

This public repository contains the TON Multisend frontend. Read the relevant design and implementation plan in `docs/superpowers/` before changing behavior. The parent workspace `PLAN.md`, when available, is the overall roadmap; the private backend must not be required to build or test this repository.

- Use a separate branch per task: `feature/<description>`, `fix/<description>`, `chore/<description>`, `docs/<description>`. Never implement features directly on `master`/`main`.
- Work in the existing checkout. Do not use git worktree. The user handles PR creation and merging; do not push or merge unless asked.
- Stack: React, strict TypeScript, Vite, Radix Themes, CSS Modules. No Tailwind or Next.js. Keep components and their tests together; avoid speculative abstractions and dependencies.
- Node and npm versions are defined in `.nvmrc` and `package.json`. Use npm with the committed lockfile. On Windows PowerShell use `npm.cmd` if execution policy blocks `npm.ps1`.
- Use meaningful failing behavior tests before implementing logic or fixing bugs. Verify configuration through real tooling; do not add tests that merely assert files exist.
- Before handing off, run `npm run check` and inspect its output. Keep CI commands aligned with local scripts. Report local verification separately from remote CI and real-device testing.
- Treat all browser code, assets and `VITE_*` values as public. Never commit credentials, private backend code, wallet seed phrases, private keys, real recipient lists or development artifacts.
- Payout amounts require exact handling; never silently round or merge recipients. Keep testnet and mainnet separate. Future transfers require authenticated durable server attempts and wallet signing; a connected wallet alone is not authentication.
- Keep focus indicators, accessible names, semantic HTML and mobile layouts. Do not present a wallet signature or API readiness as confirmed payment success.
- No deployment, analytics, real transfers or new product features are implied by maintenance work. Keep changes within the current task and document actual limitations.
