# Phase 62 — Production database release and rollback runbook

Validated: 2026-10-16. **Read-only inspection; no production schema writes.**

## Verified schema state
Neon default (production) branch:
- `invitations.started_at`: **missing**
- `email_deliveries`: **missing**
- `invitations.stage`: present

Neon isolated staging branch `br-sweet-bonus-a1gvzd06`:
- all three elements above: present

The currently deployed preview is not the release candidate for the latest GitHub commit. Do not promote any preview simply because its build is READY.

## Pre-production gate
1. Confirm GitHub CI passes for an exact release SHA and rerun source and regression checks.
2. Review all statements in `migration.sql` with database owner. The migration creates columns/indexes, a delivery table and constraints; it is not a validated reversible down-migration.
3. Record a Neon **production branch restore point / snapshot** and verify restore instructions before migration; independently retain critical data backups per company policy. Do not rely on `DROP TABLE` as rollback.
4. Run schema preflight against production using `npm run db:preflight` (read-only). Expect failure until migration is applied.
5. Schedule controlled migration with a short lock timeout and monitoring for concurrent traffic. Apply reviewed additive DDL in approved change window; capture exact errors and stop if any fail.
6. Immediately rerun `npm run db:preflight`; inspect indexes, constraint checks, and application query compatibility.
7. Complete protected preview authenticated E2E against **staging branch only**, including two-tenant isolation, candidate submission and HR review.
8. Confirm/revoke all temporary Phase48 Vercel automation bypasses. Keep deployment protection enabled.
9. Validate provider credentials, failure handling, rate limiting and secrets scope without printing any secrets.
10. Only then deploy an exact reviewed commit to production. Smoke-test production using non-destructive health/API reads.

## Rollback / recovery decision
- If the *application* release fails but database migration was successful, roll back the application deployment first to its prior known-good deployment. Additive schema usually supports older code, but confirm compatibility.
- If database migration fails partway, do **not** assume reversing individual DDL is safe. Freeze further writes where operationally appropriate, assess applied statements, and restore from the verified Neon recovery point with an owner-approved recovery procedure.
- Any restore can lose writes made after the restore point: communicate the recovery point objective and reconcile affected records.
- Do not automatically drop `email_deliveries`, new columns or indexes; doing so could destroy audit and interview records.

## Explicit current decision
**NO-GO for production**: required production schema is absent; authenticated staging workflow not yet completed; temporary automation bypass revocation unconfirmed.

No production migration, destructive SQL, or production deployment was performed in Phase 62.
