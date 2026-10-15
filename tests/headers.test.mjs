import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../next.config.mjs';
test('candidate URL never appears in outgoing Referer', async () => {
  const rules = await config.headers();
  const all = rules.find(r => r.source === '/:path*');
  assert.equal(all.headers.find(h => h.key === 'Referrer-Policy')?.value, 'no-referrer');
});
test('candidate and API routes explicitly disallow caching', async () => {
  const rules = await config.headers();
  for (const source of ['/api/:path*','/interview-studio']) {
    const rule = rules.find(r => r.source===source);
    assert.match(rule.headers.find(h=>h.key==='Cache-Control').value,/no-store/);
  }
});
