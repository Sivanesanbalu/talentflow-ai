# Phase 66 — Neon snapshot and isolated restore verification

Verified on 2026-10-16.

## Outcome
- Neon project: `broad-bread-94524530`.
- Production root/default branch: `br-gentle-wave-a1zjmush`.
- Creating a snapshot of a non-root rehearsal branch was rejected by Neon: `not allowed to snapshot non-root branch`.
- Existing snapshot list was empty at the start of this phase.
- Created a snapshot from the production root branch, **without editing its schema or data**: `snap-purple-morning-a1u90rez`.
- Restored it onto a **separate** branch `br-fragrant-leaf-a1o75b51` (no production overwrite or switchover).
- Read-only checks of the restored and production branches each returned 6 core tables and the same pre-migration state: no `email_deliveries` and no `invitations.started_at`.
- Production schema remains unchanged and **not ready for release**.

## Limits
This validates creating a root-branch snapshot and restoring an isolated copy. It does **not** validate production branch replacement, post-snapshot write reconciliation, operational recovery time, or application E2E. Do not rely on it as the only disaster recovery plan.

## Remaining release blockers
1. Controlled production migration only after approval, rollback readiness and authenticated staging E2E.
2. Revoke and verify Phase 48 temporary Vercel protection bypass credentials.
3. Verify recruiter, candidate and HR workflows with synthetic staging data.
4. Confirm provider integration configuration and authorization/rate limiting.

Current decision: **NO-GO** for production deployment.
