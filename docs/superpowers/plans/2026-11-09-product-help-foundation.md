# Product documentation foundation

Request: maintain implemented functionality as the source for detailed help and
FAQ understandable to people without cryptocurrency experience.

Use versioned Markdown in this public repository. Keep technical plans/reviews
separate from user help; never require private backend source to read the help.
This task creates documentation, not a new app screen or deployment.

1. Compare current UI, public contract, CSV guide and device observations.
2. Write docs/product/README.md as the feature catalog, beginner workflow and
   documentation index. Clearly separate implemented, device-observed, published
   and future behavior. Include privacy boundaries and common limits.
3. Write a plain Russian glossary and first FAQ draft; avoid activation/transfer
   instructions while sending is outside the current scope. Mark RU/EN UI help
   as future editorial work, not completed translation.
4. Correct stale README scope and add a contributor rule to maintain these docs
   when user-visible behavior changes. Record unclear UI text as follow-up work.
5. Verify Markdown formatting and links, review facts against source, then run
   required npm run check. Commit locally with Husky enabled; no push/deploy.

Base: origin/main d8e0b8d after fetch on 2026-11-09. Product behavior unchanged;
no regression tests invented for prose. Full check is repository-required.
