# Phase 19 — Server-enforced interview timing

Implemented an authoritative `invitations.started_at` PostgreSQL timestamp, start endpoint (`POST /api/candidate/start`), reload-aware server clock, and atomic submission deadline check. Interview duration plus 60-second network submission grace is enforced in SQL and validation. Candidate UI no longer starts the timer solely in the browser.

**Required migration:** Run the updated `migration.sql` before deploying. Existing invitations have `started_at=NULL` and begin only when the start endpoint succeeds. Resume after reload does not restore unsaved draft answers.

**Not completed:** Automatic email, full Next.js build, deployment, live end-to-end tests, persistent candidate draft recovery, or real AI provider connectivity. Production remains unchanged.
