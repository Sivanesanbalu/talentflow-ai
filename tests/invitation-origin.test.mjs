import test from 'node:test';
import assert from 'node:assert/strict';
import {invitationLink,invitationOrigin} from '../lib/invitation-origin.mjs';

test('configured HTTPS origin controls invitation domain',()=>{
 const url=invitationLink('abc',{APP_BASE_URL:'https://interviews.example.com',NODE_ENV:'production'});
 assert.equal(url,'https://interviews.example.com/interview-studio?invite=abc');
});
test('Vercel verified deployment URL is safe fallback',()=>{
 assert.equal(invitationOrigin({VERCEL_URL:'preview.example.vercel.app',NODE_ENV:'production'}),'https://preview.example.vercel.app');
});
test('missing origin is rejected',()=>assert.throws(()=>invitationOrigin({NODE_ENV:'production'}),/configuration missing/));
test('production insecure or credentialed origin is rejected',()=>{
 for(const APP_BASE_URL of ['http://evil.example','https://a:password@evil.example','https://evil.example/path','https://evil.example?redirect=x']){
  assert.throws(()=>invitationOrigin({APP_BASE_URL,NODE_ENV:'production'}));
 }
});
test('local HTTP is allowed only in development',()=>{
 assert.equal(invitationOrigin({APP_BASE_URL:'http://localhost:3000',NODE_ENV:'development'}),'http://localhost:3000');
 assert.throws(()=>invitationOrigin({APP_BASE_URL:'http://localhost:3000',NODE_ENV:'production'}));
});
