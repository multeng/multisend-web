# Wallet login implementation

Spec: `../specs/2026-10-27-wallet-auth-design.md`.

- [x] Add compatible locked TON Connect, Zod and TypeScript generator dependencies, public contract and generated DTOs.
- [x] Implement bounded native fetch and runtime schemas; verify transport cancellation, JSON deadline and safe errors.
- [x] Implement controller, SDK bridge and responsive auth panel; verify reset, challenge ordering, restoration, switching, failure recovery and late response rejection.
- [x] Add HTTPS manifest generation, PNG icon and explicit analytics opt-out.
- [ ] Run full checks, browser verification and fresh authentication review; fix important findings and commit.

Verification limits: synthetic signed backend fixtures and trusted testnet reads are separate from real wallet approvals. No HTTPS address exists yet; publication, user signatures and remote CI remain pending.
