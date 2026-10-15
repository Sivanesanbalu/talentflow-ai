import test from 'node:test';import assert from 'node:assert/strict';import{validateReissueRequest,RECOVERABLE_EMAIL_STATUSES}from'../lib/invitation-recovery.mjs';
const id='123e4567-e89b-12d3-a456-426614174000';
test('reissue requires explicit email authorization',()=>assert.throws(()=>validateReissueRequest({invitation_id:id})));
test('invalid invitation ids are rejected',()=>assert.throws(()=>validateReissueRequest({invitation_id:'test',send_email:true})));
test('valid reissue can be requested',()=>assert.equal(validateReissueRequest({invitation_id:id,send_email:true}).id,id));
test('recovery only applies to undeliverable states',()=>{assert.ok(RECOVERABLE_EMAIL_STATUSES.includes('bounced'));assert.ok(!RECOVERABLE_EMAIL_STATUSES.includes('delivered'))});
