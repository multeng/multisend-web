# Testnet payout preparation report

Implement the next accepted stage2 sub-block: an authenticated server report for the current native-TON list, with exact validation and a per-wallet technical part plan. It cannot execute or authorize payouts.

Approaches: browser-only checking leaves Go validation unenforced. An executable saved package already requires chain estimates and durable attempts from stage3A. Use a stateless protected report first, then add chain estimates and durable preparation separately.

POST /api/payouts/prepare under auth.Protect (owner, Origin, CSRF, deadlines and revocation). Request: connected address, network="-3", maxMessages integer1..255, recipients with three explicitly required strings. Match sender against authenticated Principal, never trust owner from JSON. Body64KiB, at most200 recipients, address/amount128 code points, comment500. Draft writes remain permissive. Semantic validation failures return200 valid=false and no parts; malformed/bounds400, body413, media415, wallet mismatch409, anonymous401.

Response: network,address,valid,totalNano,serviceFeeNano="0",maxMessages,rows {canonical,duplicate,errors,warnings}, errors, parts {firstRecipient,recipientCount,totalNano}, executable=false,balanceStatus="not_checked",networkFeeStatus="not_estimated". Zero-based indices and exact totals preserve duplicate rows. No transaction data, signed quote, balance guarantee, DB write or wallet call. Client maxMessages is untrusted planning information, never an authorization. Missing or legacy string-only capabilities must not be guessed.

Frontend: anonymous local preview remains offline. Only explicit signed-in action uploads recipients. Stable auth controller exposes SDK device features separately from session. Match connected address/network to session. Show report in acknowledged preview with parts, zero service fee and explicit unavailable balances/fees/sending. No send button. Reset immediately on source, account, network or capabilities change; cancel and suppress stale responses. Same-account SDK updates still notify UI. Keep RU/EN and mobile accessibility.

Acceptance: exact Go splits for200 rows at1/4/255, invalid input yields no plan; real auth HTTP checks for identity/CSRF/Origin/revocation and malformed/oversized input. Generated public DTOs and strict runtime validation. Frontend explicit-query, anonymous, race/cancellation/capability tests. Full checks and fresh review. No new dependencies/migrations/deploy/transfers. Stage2 still needs verified balances/network costs and real-device testing.

Reference: https://docs.ton.org/applications/ton-connect/get-started plus installed protocol types.
