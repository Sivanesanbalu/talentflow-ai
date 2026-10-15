# Phase 15 release gate

## Verified locally
- `npm test` – candidate and HR validation cases.
- `npm run check:source` – required source presence.
- `node --check` for all backend .js and .mjs files.

## NOT verified here
- Next.js `npm run build`: blocked by npm registry DNS `EAI_AGAIN` in the execution environment.
- End-to-end protected preview tests and DB API health response.
- GitHub push, Vercel deployment, email delivery, real-time LLM streaming/voice, production load.

## Safe release sequence
1. Run GitHub CI on the full source; stop if build fails.
2. Configure DATABASE_URL and SESSION_SECRET on Vercel. Configure OPENROUTER_API_KEY only when authorized; keep private.
3. Deploy as preview, verify protected /api/health and recruiter signup/login.
4. Run a synthetic candidate invitation, interview submission, HR review and next round. Avoid real applicant data.
5. Audit tenant isolation, request rate limiting, abuse and concurrency before production.
6. Promote only after validation. Do not disable Deployment Protection to work around test access.
