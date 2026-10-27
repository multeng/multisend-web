# Native TON validation parity

Scope: pure Go validator for future testnet payout preparation and public synthetic conformance fixtures. No HTTP handler calls the validator yet. Draft storage, authentication, OpenAPI, dependencies and deployed services are unchanged.

The version1 fixture has65 cases, including exact decimal and aggregate boundaries, malformed addresses, mixed standard/URL-safe base64, test/bounce aliases, duplicate preservation, Unicode comments and200/201 recipients. Go and Vitest assert the same projected results; both copies must have identical SHA256. Each repository tests independently. Updating policy requires deliberately updating both fixture copies and reviewing both implementations; there is no cross-private-repository build dependency.

Verification: initial Go tests failed with undefined Recipient/Validate; after implementation all65 conformance cases and issue-code/result-isolation checks passed. Frontend full `npm run check`:169 tests across18 files, contract drift/lint/format/typecheck/build pass. Backend formatting/vet/tests/build and govulncheck pass. Both fixture copies SHA256: `0389499E0497D963843BC2215CFF076C76F5A44B9705B61B08DD4C10764CAE1A`.

Fresh independent whole-branch review found no critical, important or minor issues. The reviewer independently recomputed fixture expectations using integer arithmetic and CRC, then checked the added mixed-alphabet/flag cases. Deferred checks match the scope: HTTP limits and server enforcement belong to the future preparation endpoint; ownership, fees, balance, payload and execution require separate checks. Remote CI, wallet/device behavior and deployment are not claimed.

The valid result proves input syntax only. Before sending, a future endpoint must call this validator and separately check authenticated owner/network, wallet capabilities, account state, fees, balance, payload serialization and durable attempt creation. Invalid results include a partial total of individually valid amounts for diagnostics; they must never authorize a payout.

Go vulnerability scan:0 affected imported packages/called symbols. It reports module-only GO-2026-5932 for the unused `golang.org/x/crypto/openpgp` package, which this project does not import. Local Windows race testing was not performed.
