# Mobile decimal comma fix review

Branch: fix/accept-mobile-decimal-comma, base origin/main7bc15e6.

- RED: two editor regression tests failed because inline and details inputs kept
  the comma in their emitted amount strings.
- GREEN: both handlers normalize manual decimal commas using string operations.
  Tests verify exact one-nanoton and nine-decimal values, canonical payloads,
  preview invalidation, and rejection of mixed/repeated separators, grouping,
  overprecision and unfinished values. Dot parsing/CSV/API remain unchanged.
- Full npm run check PASS: 278 tests across 26 files, public API drift, lint,
  formatting, types, production build and install metadata validation. Existing
  Vite chunk size warning remains. Updated spec formatting and diff check PASS.
- Independent read-only review: Critical0 / Important0 / Minor0. No files changed
  or suites rerun by reviewer. Physical iPhone keyboard/caret remains a device
  check after publication; jsdom does not establish native keyboard behavior.
- No backend, dependency, cloud configuration, deployment or transfer changes.
  Separate manifest MIME fix cce60d4 must also reach main before future deploys.
