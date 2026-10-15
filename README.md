# TalentFlow AI — consolidated phase 13 source

Next.js + PostgreSQL SaaS baseline assembled from prior modules. Includes recruiter auth, interview builder, candidate invitations, browser voice studio, optional OpenRouter follow-ups, candidate answer submission, HR human review/rankings and next round.

## Local start
`npm install` → `cp .env.example .env.local` → configure a *development* PostgreSQL database with the schema below → `npm run dev`.

Run `npm test` and `npm run build` before deployment. Protect preview, use separate test tenant, and run authenticated end-to-end tests before production promotion. Do not apply migrations or send invitations to genuine candidates while testing.

`migration.sql` contains additions for an *existing* TalentFlow database. Not a full database bootstrap. Automated emails, real-time streaming voice AI and code execution are **not implemented**. Browser speech depends on browser support. Human reviewer decisions are never replaced with AI grades.

No secrets included. This source has not been deployed to Vercel or pushed to GitHub.

## Phase 14 static checks
Run `npm run check:source` to verify required modules and invitation URLs before publishing.

## Status
`npm test` passes. `npm install` timed out in the available environment, so production compilation and live E2E tests remain unverified. Do not promote without those checks.

## GitHub release
This source has been transferred to GitHub. Full build, provider integration and end-to-end testing are not yet verified.
