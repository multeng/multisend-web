# Quote availability UX review

Base de7d63b, branch fix/explain-quote-availability. Frontend RU/EN explanation
changes only; no API, dependency, auth, fee arithmetic, expiry or retry changes.

Eight regressions observed RED before implementation: reported capacity, four
account states, accessible bounce caution, honest combined server error and the
stale footer after successful quote. Focused GREEN then expanded bilingual
coverage. Real editor→prepare→quote test preserves exact result on language
switch and verifies only two explicit uploads, no additional balance request
or send action.

Full npm run check PASS290tests/27files with API drift, lint, formatting, types,
build and install validator. Existing Vite >500kB warning remains. Diff check
PASS. No backend tests rerun for frontend-only changes.

Independent fresh-context read-only reviewer: Critical0 / Important0 / Minor1
corrected. English regression now excludes the actual former text (“not been
estimated”) and positively verifies the new editor/balance descriptions. Focused
integration passed again after correction. No edits or suites by reviewer.

Limits: unsupported_wallet still combines causes in public API; UI does not
infer a wallet version from ACTIVE or application name. It does not gate on a
separately timed balance result. Native iPhone/Android layout and accessibility
remain device checks after publication. No deploy/CI, cloud setting changes,
activation instructions, new wallets or transfers performed.
