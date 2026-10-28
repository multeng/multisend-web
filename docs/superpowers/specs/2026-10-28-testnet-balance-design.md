# Testnet native balance check

Date: 2026-10-28

## Intent and scope

Continue stage 2 after merged payout preparation. On explicit action, show the authenticated connected wallet's proof-verified native TON balance, account state and exact payout-only shortfall. Never claim readiness or include invented network fees. No transfers, billing, new databases, deployment or dependencies.

## Approach

Reuse the existing testnet lite-client provider with secure proof policy and trusted bootstrap. A separate protected GET /api/payouts/balance carries no recipient data and accepts no query parameters. Alternatives: a new hosted indexer adds trust/configuration; combining balance failure with static preparation would unnecessarily hide a useful part plan. These are implementation choices under the user's instruction to continue the existing roadmap.

## Contract and trust

Source address and network come exclusively from the authenticated principal. Return address, network=-3, balanceNano decimal string, accountStatus ACTIVE/UNINIT/FROZEN/NON_EXIST, blockSeqno, blockRootHash (64 lowercase hex), blockTime, checkedAt, expiresAt (Unix seconds), executable=false, networkFeeStatus=not_estimated.
Block and account proofs use the existing serialized provider snapshot. Validate block age again after account lookup; reject missing/malformed states, another account, rollback, non-testnet, block more than 5 seconds in future or at least 30 seconds old. Missing account is a proven zero only when the SDK explicitly reports its nonexistence. Expiration is min(checkedAt+30,blockTime+30); no balance cache or automatic retries. Bounded provider budget 8 seconds; safe 503 on failure, never synthetic zero.

## UI

After a valid part plan, a separate RU/EN button reads balance explicitly. Private query identity includes owner/account/network and the complete preparation input. Ignore/cancel obsolete responses and clear visible results when input/capabilities/account change. No recipient upload by balance endpoint.
Use bigint for payout-only deficit=max(total-balance,0). Always label network fees excluded; a covered payout total does not mean sufficient funds to send. Frozen, uninitialized and nonexistent states warn that availability is not established.
Client validates response fields/identity/times at runtime and deducts entire request duration from server validity; use a monotonic deadline and re-evaluate on visibility/focus plus timer. Expired results cannot show current balance or a current shortfall and require explicit recheck. No background refresh.

## Verification

Behavior tests first: malformed/unknown source vs proven absence, exact large balances, stale/future/late snapshots, owner-derived HTTP requests, 401/logout, 503, input cancellation, expiry, RU/EN mobile layout. Full frontend check, Go integration/vet/build and govulncheck; fresh read-only review. No claim of real-device signing or cloud deployment.

## Next

Accurate network cost estimation requires concrete wallet transaction payloads, network configuration/emulation and freshness rules. Remains a separate block before immutable packages/attempts and signing.
