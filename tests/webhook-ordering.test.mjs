import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const route = readFileSync(new URL('../app/api/webhooks/resend/route.js', import.meta.url), 'utf8');

test('late delivery-delayed webhook cannot regress delivered status', () => {
  assert.match(route, /NOT \(status='delivered' AND \$1='sent'\)/);
  assert.match(route, /'email\.delivery_delayed':'sent'/);
});

test('terminal bounce and complaint states are preserved', () => {
  assert.match(route, /status NOT IN \('bounced','complained'\)/);
});

test('webhook verifies signature before modifying delivery state', () => {
  assert.match(route, /verifyResendWebhook/);
  assert.ok(route.indexOf('verifyResendWebhook') < route.indexOf('await sql('));
});
