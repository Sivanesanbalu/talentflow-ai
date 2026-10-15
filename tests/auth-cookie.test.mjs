import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../app/api/auth/route.js',import.meta.url),'utf8');

test('recruiter session cookie is Secure in production but usable on HTTP localhost',()=>{
  assert.match(source,/secure:process\.env\.NODE_ENV==='production'/);
  assert.match(source,/httpOnly:true/);
  assert.match(source,/sameSite:'lax'/);
});
