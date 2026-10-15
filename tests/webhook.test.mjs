import test from 'node:test';import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';import {verifyResendWebhook} from '../lib/webhook.mjs';
const body=JSON.stringify({type:'email.delivered',data:{email_id:'test'}}),stamp='1760548800',id='msg_test',key=Buffer.alloc(32,7),secret='whsec_'+key.toString('base64');
function head(s=stamp){const h=new Headers({'svix-id':id,'svix-timestamp':s});h.set('svix-signature','v1,'+createHmac('sha256',key).update(id+'.'+s+'.'+body).digest('base64'));return h}
test('valid webhook passes',()=>assert.equal(verifyResendWebhook({body,headers:head(),secret,now:Number(stamp)*1000}),true));
test('tampered webhook fails',()=>assert.equal(verifyResendWebhook({body:body+'X',headers:head(),secret,now:Number(stamp)*1000}),false));
test('expired signature fails',()=>assert.equal(verifyResendWebhook({body,headers:head(),secret,now:Number(stamp)*1000+600000}),false));
test('missing secret fails',()=>assert.equal(verifyResendWebhook({body,headers:head(),secret:'',now:Number(stamp)*1000}),false));
