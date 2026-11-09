# Mobile TON decimal input fix

User device testing confirmed that the iPhone decimal keyboard offers a comma,
while the editor accepts only canonical decimal dots. Fix both manual amount
inputs without changing CSV, draft DTOs, backend validation or arithmetic.

1. Add failing editor behavior tests for inline and dialog comma entry: exact
   nanoton precision, canonical onChange payload and valid preview totals.
2. Normalize a single decimal comma in digit-only manual input to a dot in both
   handlers. Preserve empty/intermediate strings and malformed input for visible
   validation. No Number/parseFloat, rounding, grouping or locale guessing.
3. Cover mixed/repeated separators and more than nine fractional digits remaining
   invalid; retain dot input, preview invalidation and existing parity checks.
4. Run focused RED/GREEN, full npm run check and inspect diff. Record device
   evidence separately; no push, merge or deployment is implied by this fix.

Base: origin/main 7bc15e6 after successful fetch. Independent of unpublished
manifest MIME fix cce60d4, which remains required for future main deployments.

iPhone screenshots confirm a successful live quote (one part, zero service fee,
network estimate and native-v1 reserve). They do not demonstrate expiry or repeat
calculation; those device checks remain open. No recipient addresses copied here.
