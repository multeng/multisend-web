# Private draft shell

Finish the authorized stage1B with durable personal drafts after server-verified testnet login. Public contract `api/openapi.yaml` v0.3.0 is self-contained; never require a private repository to build. Full recipient editing, CSV import and payouts belong to later stages.

The shell creates an empty draft by name, lists owned metadata, opens details, renames while preserving every original recipient string, and deletes after confirmation. Backend checks ownership and optimistic versions; client never supplies user_id. Storage bounds:100 drafts,200 rows,64KiB body,120-character name. These are storage limits, not payout limits.

Use generated DTOs and Zod response validation with the existing cancellable native fetch. Version and amount remain strings. Private TanStack keys contain userID, wallet address and network. No cache persistence, write retry or offline queue. Authentication changes unmount the identity-bound shell, cancel operations and remove private cache. Late write responses must not restore private data. On409 retain entered name and offer explicit reload. On401 revoke local access immediately.

Acceptance: transport and component tests cover identity keys, exact strings, creation/open/rename/confirmation/conflict and logout during pending writes. Check responsive browser layout. Real wallet approval remains pending an HTTPS origin; no deployment is authorized.
