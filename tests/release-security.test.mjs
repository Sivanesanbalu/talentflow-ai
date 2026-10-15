import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const code=p=>readFileSync(p,'utf8');
test('candidate POST claims invitation atomically and avoids duplicates',()=>{
 const s=code('app/api/candidate/route.js');
 assert.match(s,/UPDATE invitations SET status='completed'/);
 assert.match(s,/ON CONFLICT \(invitation_id\) DO NOTHING/);
 assert.match(s,/validateAnswers\(/);
});
test('human-review operations scope records to organization',()=>{
 for (const file of ['app/api/review/route.js','app/api/rankings/route.js','app/api/next-round/route.js']) {
  const s=code(file);assert.match(s,/requireMe\(/);assert.match(s,/org_id/);
 }
});
test('secrets and build artifacts are excluded',()=>{
 const ignore=code('.gitignore');assert.match(ignore,/\.env\*/);assert.match(ignore,/node_modules/);assert.match(ignore,/\.next/);
 assert.ok(!existsSync('.env.local'));
});
test('deployment has a health endpoint and voice-studio invitation links',()=>{
 assert.match(code('app/api/health/route.js'),/SELECT 1/);
 for (const file of ['app/api/invitations/route.js','app/api/next-round/route.js'])assert.match(code(file),/\/interview-studio\?invite=/);
});
