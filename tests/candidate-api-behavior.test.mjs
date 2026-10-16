import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateAnswers,validateInvitationToken,validateInterviewWindow,validateActiveSession} from '../lib/candidate-validation.mjs';

const token='a'.repeat(64);
const now=Date.now();
const invite=()=>({id:'invite-1',status:'invited',expires_at:new Date(now+3600000).toISOString(),scheduled_at:null,started_at:new Date(now-1000).toISOString(),duration_minutes:30,questions:[{text:'Q1'}],role:'Engineer'});
function makeRoute(sql){
 const source=readFileSync(new URL('../app/api/candidate/route.js',import.meta.url),'utf8').replace(/^import .*;?$/gm,'').replace(/export async function /g,'async function ');
 return new Function('sql','hash','fail','validateAnswers','validateInvitationToken','validateInterviewWindow','validateActiveSession','Response',source+'\nreturn POST')(
  sql,t=>createHash('sha256').update(t).digest('hex'),
  e=>Response.json({error:e.message},{status:400}),
  validateAnswers,validateInvitationToken,validateInterviewWindow,validateActiveSession,Response);
}
const request=answers=>({json:async()=>({token,answers,tab_switches:0})});

test('valid candidate assessment stores one submission',async()=>{
 let submitted=false;
 const post=makeRoute(async(q,params)=>{
  if(q.includes('SELECT v.id'))return {rows:[invite()]};
  assert.match(q,/ON CONFLICT \(invitation_id\) DO NOTHING/);
  assert.match(q,/UPDATE invitations SET status='completed'/);
  assert.equal(params[0],'invite-1');
  submitted=true;return {rowCount:1,rows:[{id:'s1'}]};
 });
 const res=await post(request(['Complete answer']));
 assert.equal(res.status,200);
 assert.equal(submitted,true);
});

test('duplicate or closed assessment returns 409',async()=>{
 const post=makeRoute(async(q)=>q.includes('SELECT v.id')?{rows:[invite()]}:{rowCount:0,rows:[]});
 const res=await post(request(['Answer']));
 assert.equal(res.status,409);
});

test('invalid answer count stops before submission SQL',async()=>{
 let writes=0;
 const post=makeRoute(async(q)=>{if(q.includes('SELECT v.id'))return {rows:[invite()]};writes++;return {rowCount:1};});
 const res=await post(request([]));
 assert.equal(res.status,400);assert.equal(writes,0);
});

test('expired assessment session stops before submission SQL',async()=>{
 let writes=0;
 const expired={...invite(),started_at:new Date(now-3600000).toISOString()};
 const post=makeRoute(async(q)=>{if(q.includes('SELECT v.id'))return {rows:[expired]};writes++;return {rowCount:1};});
 const res=await post(request(['Answer']));
 assert.equal(res.status,400);assert.equal(writes,0);
});

test('invalid invitation token is rejected before SQL',async()=>{
 let calls=0;
 const post=makeRoute(async()=>{calls++;return {rows:[]};});
 const res=await post({json:async()=>({token:'invalid',answers:['Answer']})});
 assert.equal(res.status,400);assert.equal(calls,0);
});
