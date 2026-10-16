import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateInvitationToken} from '../lib/candidate-validation.mjs';

function handler(sql) {
 const src=readFileSync(new URL('../app/api/candidate/start/route.js',import.meta.url),'utf8')
 .replace(/^import .*;?$/gm,'').replace(/export async function /g,'async function ');
 return new Function('sql','hash','fail','validateInvitationToken','Response',src+'\nreturn POST')(
  sql,v=>createHash('sha256').update(v).digest('hex'),
  e=>Response.json({error:e.message},{status:400}),validateInvitationToken,Response);
}
const token='a'.repeat(64);
const req=t=>({json:async()=>({token:t})});

test('start updates existing invitation and returns no-store timing response',async()=>{
 let count=0;
 const start=handler(async(sql,params)=>{
  count++;
  assert.ok(sql.includes('started_at=COALESCE(v.started_at,now())'));
  assert.ok(sql.includes("v.status='invited'"));
  assert.ok(sql.includes('v.expires_at>now()'));
  assert.ok(sql.includes("interval '60 seconds'"));
  assert.deepEqual(params,[createHash('sha256').update(token).digest('hex')]);
  return {rowCount:1,rows:[{started_at:'2026-10-16T10:00:00Z',duration_minutes:30,server_time:'2026-10-16T10:00:01Z'}]};
 });
 const res=await start(req(token));
 assert.equal(res.status,200);assert.equal(count,1);
 assert.equal(res.headers.get('cache-control'),'no-store');
 assert.equal((await res.json()).duration_minutes,30);
});
test('already closed or expired invitation returns conflict',async()=>{
 const res=await handler(async()=>({rowCount:0,rows:[]}))(req(token));
 assert.equal(res.status,409);
});
test('invalid token stops before database access',async()=>{
 let count=0;
 const res=await handler(async()=>{count++;return {rowCount:1}})(req('bad-token'));
 assert.equal(res.status,400);assert.equal(count,0);
});
test('repeated start uses original timestamp rather than resetting session clock',async()=>{
 const stamps=[];
 const start=handler(async(sql)=>{
  assert.ok(sql.includes('COALESCE(v.started_at,now())'));
  stamps.push('2026-10-16T10:00:00Z');
  return {rowCount:1,rows:[{started_at:stamps[0],duration_minutes:30,server_time:'2026-10-16T10:01:00Z'}]};
 });
 const a=await (await start(req(token))).json();
 const b=await (await start(req(token))).json();
 assert.equal(a.started_at,b.started_at);
});
