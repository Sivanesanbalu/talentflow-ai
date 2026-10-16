# Phase 63 — Release candidate database preflight (read-only)

Verified 2026-10-16 against Neon project broad-bread-94524530.

| Required schema | Staging branch br-sweet-bonus-a1gvzd06 | Production default branch |
|---|---:|---:|
| Invitations columns | 5/5 | 4/5 |
| Submissions columns | 5/5 | 5/5 |
| Email deliveries columns | 10/10 | 0/10 |
| Email delivery indexes | 2/2 | 0/2 |

Staging also contains required delivery constraints:
- email_deliveries_invitation_id_fkey
- email_deliveries_invitation_id_kind_key
- email_deliveries_status_check (including sent, failed, not_configured, pending, delivered, bounced, complained).

This is read-only SQL metadata verification, **not** executed production `db:preflight`, not a full migration rehearsal, and not authenticated HTTP E2E.

Decision: **NO-GO**. Production needs the reviewed migration and verification; authenticated staging workflows and temporary Vercel bypass cleanup remain unconfirmed. Do not promote.

No migrations, credential changes or production deployments were made.
