# Phase 17 release engineering status

- Consolidated application source from Phase 16.
- Added regression tests asserting atomic candidate submission, organization-scoped HR review, secret-file exclusion, and correct invitation links.
- GitHub Actions CI workflow includes Node 22 install, unit/source checks, and Next.js production compilation. Currently uses `npm install` because the lockfile cannot be generated in this environment; generate and commit a lockfile, then switch CI to `npm ci` before a certified release.
- A private TalentFlow-specific GitHub repository has **not** been created; do not overwrite unrelated existing recruiter repositories.
- Local npm registry lookup failed with EAI_AGAIN, so production build is unverified here.
- Protected Vercel preview remains unauthenticated in automated tests. No production promotion.
- OPENROUTER_API_KEY and automatic email delivery are not configured.
- Recommendation: do not onboard real candidates until authenticated end-to-end tests, privacy review, and functional live tests pass.
