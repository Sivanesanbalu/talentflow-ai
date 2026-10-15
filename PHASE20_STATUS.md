# Phase 20: Email invitations and reminders

- Added opt-in recruiter-triggered invitations: set `send_email=true` when creating an invitation.
- Added Resend delivery provider integration using `RESEND_API_KEY` and verified `EMAIL_FROM` domain.
- Without credentials, API returns the secure link for manual delivery and marks delivery `not_configured`.
- Added email delivery audit table and recruiter-scoped status endpoint; **initial invitation email audit records are not yet automatically persisted**.
- Added Vercel daily Cron reminder route, guarded by `CRON_SECRET`; reminds only for interviews in a 23–25 hour window, subject to the daily 08:00 UTC schedule. This timing means some schedules will not get reminders. More frequent scheduling/queue is required for production.
- Reminders deliberately never reveal or recreate candidate tokens (stored hashed).
- `email_deliveries` migration must run prior to Cron deployment.
- No real email sent; no deployment, GitHub push, or live tests.
- Next tasks: persist invitation delivery records without leaking tokens, transactional reliability, API rate limits and provider webhook verification, end-to-end testing.
