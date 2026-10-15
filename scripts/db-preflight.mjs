// Read-only production schema preflight. Never logs database credentials.
import pg from 'pg';
const REQUIRED = {
  invitations: ['id', 'token_hash', 'started_at', 'stage', 'parent_invitation_id'],
  submissions: ['invitation_id', 'reviewed_at', 'reviewed_by'],
  email_deliveries: ['id', 'invitation_id', 'kind', 'status', 'recipient', 'attempts', 'next_attempt_at', 'last_error', 'updated_at']
};
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required to check schema.');
  process.exitCode = 2;
} else {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    const names = Object.keys(REQUIRED);
    const result = await client.query(
      "SELECT table_name,column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ANY($1::text[])",
      [names]
    );
    const present = new Set(result.rows.map(({table_name,column_name}) => table_name + '.' + column_name));
    const missing = Object.entries(REQUIRED).flatMap(([table, columns]) =>
      columns.filter(col => !present.has(table + '.' + col)).map(col => table + '.' + col));
    const checks = await client.query(
      "SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid = to_regclass('public.email_deliveries')"
    );
    const constraints = new Map(checks.rows.map(r => [r.conname, r.definition]));
    const requiredConstraints = [
      'email_deliveries_invitation_id_fkey',
      'email_deliveries_invitation_id_kind_key',
      'email_deliveries_status_check'
    ];
    const missingConstraints = requiredConstraints.filter(name => !constraints.has(name));
    const statusRule = constraints.get('email_deliveries_status_check') || '';
    for (const status of ['pending','sent','failed','not_configured','delivered','bounced','complained']) {
      if (!statusRule.includes(status)) missingConstraints.push('email_deliveries_status_check: ' + status);
    }
    const indexResult = await client.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname = ANY($1::text[])",
      [['ix_email_deliveries_retries','ix_email_deliveries_provider_message_id']]
    );
    const indexes = new Set(indexResult.rows.map(r => r.indexname));
    const missingIndexes = ['ix_email_deliveries_retries','ix_email_deliveries_provider_message_id'].filter(x => !indexes.has(x));
    missing.push(...missingConstraints.map(x => 'constraint.' + x), ...missingIndexes.map(x => 'index.' + x));
    if (missing.length) {
      console.error('BLOCKED: missing database schema elements:\n' + missing.map(x => ' - ' + x).join('\n'));
      console.error('Review migration.sql before deploying; this preflight performs no writes.');
      process.exitCode = 1;
    } else {
      console.log('PASS: required Phase 23 database columns, constraints and indexes detected (read-only check).');
    }
  } catch (err) {
    console.error('Database preflight failed:', err.code || err.name || 'unknown_error');
    process.exitCode = 2;
  } finally {
    await client.end().catch(() => {});
  }
}
