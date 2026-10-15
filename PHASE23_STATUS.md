# Phase 23 — Recruiter notifications and invitation reissue

Implemented: recruiter-scoped delivery problem feed, notification UI, explicit reissue operation for undeliverable invitations, replacement token hash invalidating old link, idempotency key, email-provider required.

Important limitations: full production build and database-backed E2E tests are not verified. Reissue resets the token before sending; a failed provider request leaves the new token unsent and needs another recruiter attempt. Webhook and provider status updates may race with reissue; production should use an immutable per-attempt delivery ledger plus a queue/outbox. Invite links should only be sent to intended recipient. No real email sent, no migrations applied, and no deployment performed.
