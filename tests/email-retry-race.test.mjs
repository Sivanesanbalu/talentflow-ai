import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../app/api/cron/retry-emails/route.js', import.meta.url), 'utf8');

test('retry worker cannot overwrite provider terminal delivery statuses', () => {
  const guardedUpdates = source.match(/status NOT IN \('delivered','bounced','complained'\)/g) || [];
  assert.equal(guardedUpdates.length, 3, 'all retry finalization updates must protect terminal statuses');
});

test('retry worker uses an atomic claim and remains authorization-gated', () => {
  assert.match(source, /FOR UPDATE OF d SKIP LOCKED/);
  assert.match(source, /CRON_SECRET/);
  assert.match(source, /Bearer \$\{secret\}/);
});
