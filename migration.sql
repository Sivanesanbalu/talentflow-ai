-- Additive, non-destructive schema changes for TalentFlow AI Milestone 3.
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS stage integer NOT NULL DEFAULT 1;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS parent_invitation_id uuid REFERENCES invitations(id);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES recruiters(id);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS ux_invitations_next_round_parent ON invitations(parent_invitation_id) WHERE parent_invitation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_review ON submissions(review_status, review_score DESC);

-- Phase 19: authoritative assessment start timestamp. Run before deploying the API.
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS started_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_invitations_started_at ON invitations(started_at) WHERE started_at IS NOT NULL;

-- Phase 20: notification audit trail and idempotent reminder jobs.
CREATE TABLE IF NOT EXISTS email_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('invitation','reminder')),
 status text NOT NULL CHECK(status IN ('sent','failed','not_configured','pending')),
 recipient text NOT NULL,
 provider_message_id text,
 created_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz,
 UNIQUE(invitation_id,kind)
);
CREATE INDEX IF NOT EXISTS ix_email_deliveries_status ON email_deliveries(status,created_at);

-- Phase 21: provider delivery statuses.
ALTER TABLE email_deliveries DROP CONSTRAINT IF EXISTS email_deliveries_status_check;
ALTER TABLE email_deliveries ADD CONSTRAINT email_deliveries_status_check CHECK (status IN ('sent','failed','not_configured','pending','delivered','bounced','complained'));
CREATE UNIQUE INDEX IF NOT EXISTS ix_email_deliveries_provider_message_id ON email_deliveries(provider_message_id) WHERE provider_message_id IS NOT NULL;


-- Phase 22 durable retry metadata. Apply migration before deploying retry cron.
ALTER TABLE email_deliveries ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE email_deliveries ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE email_deliveries ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE email_deliveries ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS ix_email_deliveries_retries ON email_deliveries(next_attempt_at)
  WHERE status IN ('failed','pending');
