# Phase 21 — Email delivery reliability

Implemented: persisted initial invitation delivery records; deterministic provider idempotency key for invitations and reminders; authenticated Resend webhook for delivered/bounced/complained statuses; signature timestamp tolerance ±5 minutes and constant-time comparison; SQL schema updates and tests. 

Limitations: the invitation + email audit write is not a single transaction; a database failure after send can cause an inconsistent API result. Reminder schedule is daily and may miss interviews. Webhook delivery has no event-id deduplication table or event-order recovery. No credential available, no real emails sent, no external deployment or end-to-end test. Full npm/Next build unverified.

Configure on deployment: RESEND_API_KEY, EMAIL_FROM, RESEND_WEBHOOK_SECRET and CRON_SECRET. Run migration before enabling reminders/webhooks. Never commit secrets.
