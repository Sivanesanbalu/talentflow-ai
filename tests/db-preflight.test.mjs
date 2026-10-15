import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('database preflight is read-only and checks schema constraints', () => {
  const source = readFileSync(new URL('../scripts/db-preflight.mjs', import.meta.url), 'utf8');
  assert.match(source, /information_schema\.columns/);
  assert.match(source, /to_regclass\('public\.email_deliveries'\)/);
  assert.match(source, /email_deliveries_invitation_id_fkey/);
  assert.match(source, /email_deliveries_invitation_id_kind_key/);
  assert.match(source, /ix_email_deliveries_retries/);
  assert.match(source, /ix_email_deliveries_provider_message_id/);
  assert.doesNotMatch(source, /client\.query\(\s*['"`]\s*(?:INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)\b/i);
});

test('database preflight checks critical provider statuses', () => {
  const source = readFileSync(new URL('../scripts/db-preflight.mjs', import.meta.url), 'utf8');
  for (const status of ['pending', 'sent', 'failed', 'not_configured', 'delivered', 'bounced', 'complained']) {
    assert.ok(source.includes("'"+status+"'"), status + ' validation missing');
  }
});
