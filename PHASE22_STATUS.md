# Phase 22 email reliability and dashboard

Added backend retry handler `/api/cron/retry-emails` (requires `CRON_SECRET`), additive retry metadata migration, recruiter-scoped delivery analytics endpoint, and `/recruiter/delivery` UI.

**Important limitations:** The retry worker can safely resend reminders using a stable provider idempotency key. Failed *invitation* emails cannot be reconstructed from hashed invitation tokens, so the code intentionally marks them permanently failed and requires recruiter reissuance. Vercel Hobby daily cron schedule is not a reliable time-to-send SLA; 24-hour reminder delivery coverage is limited. Email provider credentials absent, no real emails sent. Full Next.js build and live deployment unverified. Apply migrations before deployment. Email delivery providers can have transient errors or ambiguous send acknowledgements; monitor and review queue before production use.
