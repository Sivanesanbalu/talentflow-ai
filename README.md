# TalentFlow AI — AI Interview SaaS

Next.js 15, React 19, and PostgreSQL application with recruiter authentication, job interview configuration, candidate invitation links, browser-based voice interview studio, optional AI follow-up questions, interview submissions, human HR review, rankings, next-round workflow, and email notification/recovery source.

## GitHub source status

This is the consolidated **Phase 23** source on the public `main` branch. Source upload and CI workflow updates have been performed through the connected GitHub integration. **A successful production build, database-backed E2E run, and deployment of this revision have not yet been confirmed.** Do not consider this code production validated.

## Local verification

```sh
npm install
npm test
npm run check:source
npm run build
```

Use Node.js 24, matching GitHub CI and the existing Vercel project. The GitHub workflow performs source, unit, and production compilation checks. CI passing must be confirmed separately.

## Environment

Copy `.env.example` to a local, ignored `.env.local`. Configure a development PostgreSQL database and a strong `SESSION_SECRET`. Optional integrations require `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, and `CRON_SECRET` as applicable. Never commit actual values to this public repository.

`migration.sql` is **additive for the existing TalentFlow schema**, not a complete database bootstrap. Review and apply migrations in a controlled environment before using API routes depending on new columns/tables.

## Capabilities and limits

- Browser voice depends on speech-recognition and text-to-speech browser support. This is not a verified real-time telephony or full-duplex voice provider integration.
- AI follow-up and external email delivery require configured providers; real provider workflows are not yet E2E verified.
- Phase 23 invitation reissue invalidates the old token before provider delivery. A delivery failure needs recruiter recovery; webhook races and an immutable email-attempt ledger remain unresolved.
- Multi-tenant isolation, rate limiting, abuse handling, DB races, live integration, accessibility and load must be assessed before production promotion.

## Release gates

1. Confirm GitHub Actions build success for the exact commit being released.
2. Validate database migration compatibility in a staging/test tenant.
3. Deploy to an authenticated Vercel preview (do not disable protection).
4. Test recruiter login, interview creation, invitation, candidate session/submission, human review, next-round and provider failures without real applicant data.
5. Promote to production only after those checks; track deployed Git SHA.

See `PHASE23_STATUS.md` and `RELEASE_CHECKLIST.md` for current caveats.
