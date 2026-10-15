import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../app/api/auth/route.js',import.meta.url),'utf8');

test('registration uses one atomic SQL statement for organization and recruiter',()=>{
  assert.match(source,/WITH new_org AS \(INSERT INTO organizations\(name\)/);
  assert.match(source,/INSERT INTO recruiters\(org_id,email,password_hash\) SELECT id,\$2,\$3 FROM new_org/);
  assert.doesNotMatch(source,/const o=\(await sql\('INSERT INTO organizations/);
});
test('session cookie remains secure for production',()=>{
  assert.match(source,/httpOnly:true,secure:process\.env\.NODE_ENV==='production'/);
});
