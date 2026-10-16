import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('initial invitation token response is private and no-store',()=>{
 const text=source('../app/api/invitations/route.js');
 assert.match(text,/providerMessageId:delivery\.providerId\},\{headers:\{'Cache-Control':'private, no-store'\}\}/);
});
test('next-round invitation token response is private and no-store',()=>{
 const text=source('../app/api/next-round/route.js');
 assert.match(text,/status:201,headers:\{'Cache-Control':'private, no-store'\}/);
});
