# Native TON validation parity

Implement the already agreed stage2 requirement that TypeScript and Go agree on payout input. This bounded block supplies the pure Go validator and public synthetic conformance fixtures; it does not introduce a payout endpoint, estimate, transaction, migration or deployment. A future preparation endpoint must invoke this validator before accepting an immutable package. Draft storage deliberately continues accepting unfinished input.

Approach: mirror the existing frontend rules in a small `internal/payouts` package, with byte-identical JSON fixtures in both repositories. A shared runtime package would couple two languages and private/public builds; validating only in the browser would let callers bypass the rules. No new dependency is required.

Rules: 1..200 rows; raw workchain0/-1 plus64 hex digits, or48-character standard/URL base64 TEP2 address with valid CRC and supported flags/workchains. Preserve input and row order. Canonicalization ignores bounce/test flags for duplicate detection; all duplicate rows warn, never merge. A missing testOnly flag warns but cannot establish which chain owns an address. Positive native amount with ASCII decimal point and at most9 fractional digits, no exponent/sign/whitespace/leading zeros, input at most128 characters; exact nanotons in `(0,2^120)`. Batch total must be less than2^120. Comment at most500 Unicode code points. Invalid rows still contribute individually valid amounts to the displayed partial total; callers must inspect Valid before using it.

Go exposes `Validate([]Recipient) Result`, with string nanotons, machine-readable issue codes and no mutable big.Int in results. The package is specific to testnet preparation policy, not a mainnet validator. It checks syntax, not ownership, account state, balance, gas, payload feasibility or chain execution. It must not be wired into draft writes.

Acceptance: both suites consume the same version1 fixture bytes independently; cover boundaries, canonical duplicates, Unicode comments, invalid checksums/flags/workchains and aggregate overflow. Both repositories build/test independently. A fixture change requires reviewing both copies; test fixtures are public synthetic data only.

Protocol references: https://github.com/ton-blockchain/TEPs/blob/master/text/0002-address.md and https://docs.ton.org/foundations/messages/internal .
