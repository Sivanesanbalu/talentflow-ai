import test from 'node:test';import assert from 'node:assert/strict';import{delayMinutes,isRetryable,MAX_ATTEMPTS,outcome}from'../lib/retry.mjs';
test('exponential retry delay capped at a day',()=>{assert.equal(delayMinutes(1),5);assert.equal(delayMinutes(2),10);assert.equal(delayMinutes(4),40);assert.equal(delayMinutes(12),1440)});
test('invalid attempts rejected',()=>assert.throws(()=>delayMinutes(0)));
test('only failed or abandoned pending messages can retry below max',()=>{assert.equal(isRetryable('failed',4),true);assert.equal(isRetryable('pending',0),true);assert.equal(isRetryable('delivered',1),false);assert.equal(isRetryable('failed',MAX_ATTEMPTS),false)});
test('provider delivery outcome',()=>{assert.deepEqual(outcome({status:'sent'},2),{status:'sent',delay:0});assert.deepEqual(outcome({status:'failed'},2),{status:'failed',delay:10})});
