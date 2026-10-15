import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRecipient,invitationEmail,deliverEmail} from '../lib/email.mjs';
test('rejects invalid recipient',()=>assert.throws(()=>validateRecipient('a b@example.com')));
test('normalizes recipient',()=>assert.equal(validateRecipient(' Test@Example.com '),'test@example.com'));
test('requires HTTPS invitation link',()=>assert.throws(()=>invitationEmail({url:'http://localhost/secret'})));
test('invitation includes role and secure link',()=>{let m=invitationEmail({role:'AI Engineer',url:'https://example.com/interview-studio?invite=x'});assert.match(m.text,/AI Engineer/);assert.match(m.text,/https:/)});
test('email delivery gracefully reports missing configuration',async()=>{let k=process.env.RESEND_API_KEY,f=process.env.EMAIL_FROM;delete process.env.RESEND_API_KEY;delete process.env.EMAIL_FROM;try{assert.equal((await deliverEmail({to:'a@example.com',subject:'Test',text:'Hi'})).status,'not_configured')}finally{if(k)process.env.RESEND_API_KEY=k;if(f)process.env.EMAIL_FROM=f}});
