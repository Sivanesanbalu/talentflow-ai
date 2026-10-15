import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../app/api/health/route.js', import.meta.url), 'utf8');

test('public health does not reveal AI or email provider configuration', () => {
  assert.doesNotMatch(source, /OPENROUTER_API_KEY|RESEND_API_KEY|autoEmail|aiFollowupsConfigured/);
});
test('health responses are uncached and distinguish database outage', () => {
  assert.match(source, /no-store/);
  assert.match(source, /status:503/);
  assert.match(source, /SELECT 1/);
});
