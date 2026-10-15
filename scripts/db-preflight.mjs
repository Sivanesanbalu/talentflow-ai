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
    if (missing.length) {
      console.error('BLOCKED: missing database schema elements:\n' + missing.map(x => ' - ' + x).join('\n'));
      console.error('Review migration.sql before deploying; this preflight performs no writes.');
      process.exitCode = 1;
    } else {
      console.log('PASS: required Phase 23 database columns detected (read-only check).');
    }
  } catch (err) {
    console.error('Database preflight failed:', err.code || err.name || 'unknown_error');
    process.exitCode = 2;
  } finally {
    await client.end().catch(() => {});
  }
}
