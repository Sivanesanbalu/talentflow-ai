import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAnswers,validateInvitationToken,validateInterviewWindow,validateActiveSession} from '../lib/candidate-validation.mjs';

const now=Date.parse('2026-10-16T12:00:00Z');
const invite=(changes={})=>({
  status:'invited',expires_at:new Date(now+3600000).toISOString(),
  scheduled_at:null,started_at:new Date(now-60_000).toISOString(),
  duration_minutes:30,...changes
});

test('candidate invitation token is exactly 64 lowercase hex characters',()=>{
 assert.equal(validateInvitationToken('a'.repeat(64)),'a'.repeat(64));
 for(const invalid of ['A'.repeat(64),'g'.repeat(64),'a'.repeat(63),'a'.repeat(65),null,{},'']) {
  assert.throws(()=>validateInvitationToken(invalid),/Invalid invitation token/);
 }
});

test('candidate answers require exact question count and bounded string size',()=>{
 assert.deepEqual(validateAnswers(['one','two'],2),['one','two']);
 for(const answers of [[],['only'],['one',3],['x'.repeat(20001),'two'],null]) {
  assert.throws(()=>validateAnswers(answers,2),/Invalid answer/);
 }
 assert.doesNotThrow(()=>validateAnswers(['x'.repeat(20000)],1));
});

test('invitation blocks expired, completed and prematurely scheduled attempts',()=>{
 assert.throws(()=>validateInterviewWindow(invite({status:'completed'}),now),/unavailable/);
 assert.throws(()=>validateInterviewWindow(invite({expires_at:new Date(now-1).toISOString()}),now),/expired/);
 assert.throws(()=>validateInterviewWindow(invite({scheduled_at:new Date(now+16*60000).toISOString()}),now),/not open/);
 assert.equal(validateInterviewWindow(invite({scheduled_at:new Date(now+15*60000).toISOString()}),now),true);
});

test('active session blocks missing start and enforces duration plus 60s grace',()=>{
 assert.throws(()=>validateActiveSession(invite({started_at:null}),now),/not started/);
 const started=new Date(now-31*60000).toISOString();
 assert.equal(validateActiveSession(invite({started_at:started}),now),true);
 assert.throws(()=>validateActiveSession(invite({started_at:new Date(now-31*60000-1).toISOString()}),now),/time has expired/);
 assert.throws(()=>validateActiveSession(invite({duration_minutes:0}),now),/Invalid interview duration/);
});
