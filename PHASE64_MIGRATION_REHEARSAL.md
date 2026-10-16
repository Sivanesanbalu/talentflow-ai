# Phase 64 — Migration reapplication rehearsal

Date: 2026-10-16.

A separate Neon branch `br-aged-block-a1a3d2hv` was created from already-migrated staging `br-sweet-bonus-a1gvzd06`.

- Fetched current `migration.sql` from GitHub (18 DDL statements).
- Executed all 18 statements in one transaction on the **rehearsal branch only**; the Neon tool returned 18 successful statement results, no errors.
- Checked resulting schema: invitations required columns 5/5; submissions required columns 5/5; email deliveries required columns 10/10; required delivery indexes 2/2.
- These results establish migration *reapplication* on an already-migrated copy, not successful migration of an unmigrated production clone. Note that `DROP CONSTRAINT IF EXISTS` and `ADD CONSTRAINT` modify the constraint on every reapplication; treat as operational DDL, not universally safe or lock-free.
- Production schema remains incompatible; no production migration, promotion or credential changes were performed.
- Authenticated recruiter/candidate/HR staging E2E remains unverified; temporary Phase48 bypass cleanup remains unconfirmed.

Release decision: **NO-GO** pending production-like old-schema migration rehearsal, snapshot/recovery validation, authenticated staging E2E and security cleanup.
