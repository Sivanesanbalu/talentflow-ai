# Phase 16 — release candidate checks

- This repository is a **source candidate**; it has not been pushed to GitHub or newly deployed.
- `npm test` and `npm run check:source` must pass.
- `npm run build` is required in networked CI; source checks are not a substitute.
- `npm run smoke` requires `TALENTFLOW_URL` and a publicly accessible URL. A Vercel-protected preview requires authenticated `vercel curl` commands.
- The AI provider key is not configured on the existing project; follow-up will return an unavailable notice.
- A candidate cannot safely be used for production hiring until tenant isolation, rate limits, expiration, real browser/mic tests, privacy and accessibility review, and full workflow tests pass.
- `GitHub` repository creation is not exposed by the connected integration; repository push not completed.
- Production is intentionally unchanged.
