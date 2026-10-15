import test from 'node:test';
import assert from 'node:assert/strict';
import {validateActiveSession} from '../lib/candidate-validation.mjs';
const now=Date.parse('2026-10-15T12:00:00.000Z');
const base={status:'invited',expires_at:'2026-11-15T12:00:00.000Z',scheduled_at:null,duration_minutes:30,started_at:'2026-10-15T11:30:00.000Z'};
test('server deadline includes a minute for submission transport',()=>{
  assert.equal(validateActiveSession(base,now),true);
  assert.equal(validateActiveSession(base,now+60_000),true);
  assert.throws(()=>validateActiveSession(base,now+60_001),/expired/);
});
test('cannot submit without starting',()=>assert.throws(()=>validateActiveSession({...base,started_at:null},now),/not started/));
test('cannot submit expired invitation',()=>assert.throws(()=>validateActiveSession({...base,expires_at:'2026-10-14T00:00:00Z'},now),/expired/));
test('cannot submit before scheduled opening',()=>assert.throws(()=>validateActiveSession({...base,scheduled_at:'2026-10-15T14:00:00Z'},now),/not open/));
