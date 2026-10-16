import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

function handler(file, mocks) {
 const source=readFileSync(new URL(file,import.meta.url),'utf8')
  .replace(/^import .*;?$/gm,'').replace(/export async function /g,'async function ');
 return new Function('sql','requireMe','fail','Response',source+'\nreturn {GET:typeof GET==="function"?GET:undefined,POST:typeof POST==="function"?POST:undefined};')(
  mocks.sql,mocks.requireMe,mocks.fail,Response
 );
}

test('recruiter queue executes tenant-filtered SQL with authenticated organization id',async()=>{
 const calls=[];
 const routes=handler('../app/api/recruiter/submissions/route.js',{
  requireMe:async()=>({org_id:'org-42'}),
  sql:async(query,params)=>{calls.push({query,params});return {rows:[{id:'submission-1'}]};},
  fail:e=>{throw e}
 });
 const response=await routes.GET();
 assert.equal(response.status,200);
 assert.deepEqual((await response.json()).submissions,[{id:'submission-1'}]);
 assert.deepEqual(calls[0].params,['org-42']);
 assert.match(calls[0].query,/WHERE i\.org_id=\$1/);
 assert.match(calls[0].query,/ORDER BY s\.completed_at DESC/);
 assert.equal(response.headers.get('cache-control'),'no-store');
});

test('recruiter queue rejects missing authentication without querying data',async()=>{
 let queried=false;
 const routes=handler('../app/api/recruiter/submissions/route.js',{
  requireMe:async()=>{const e=new Error('Authentication required');e.status=401;throw e;},
  sql:async()=>{queried=true;return {rows:[]};},
  fail:e=>Response.json({error:e.message},{status:e.status||500})
 });
 const response=await routes.GET();
 assert.equal(response.status,401);
 assert.equal(queried,false);
});

test('HR review handler requires authenticated identity before any SQL',async()=>{
 let queried=false;
 const source=readFileSync(new URL('../app/api/review/route.js',import.meta.url),'utf8')
  .replace(/^import .*;?$/gm,'').replace(/export async function /g,'async function ');
 const post=new Function('sql','requireMe','fail','validateReview','Response',source+'\nreturn POST')(
  async()=>{queried=true;return {rowCount:0,rows:[]}},
  async()=>{const e=new Error('Authentication required');e.status=401;throw e;},
  e=>Response.json({error:e.message},{status:e.status||500}),
  x=>x,Response
 );
 const response=await post({json:async()=>({submission_id:'foreign',score:80,status:'reviewed'})});
 assert.equal(response.status,401);
 assert.equal(queried,false);
});

function reviewHandler({sql,requireMe,validateReview}) {
 const source=readFileSync(new URL('../app/api/review/route.js',import.meta.url),'utf8')
  .replace(/^import .*;?$/gm,'').replace(/export async function /g,'async function ');
 return new Function('sql','requireMe','fail','validateReview','Response',source+'\nreturn POST')(
  sql,requireMe,e=>{throw e},validateReview,Response
 );
}

test('foreign tenant cannot review a submission and query scopes org id',async()=>{
 let call;
 const post=reviewHandler({
  requireMe:async()=>({id:'reviewer-b',org_id:'org-b'}),
  validateReview:b=>({submissionId:b.submission_id,score:b.score,status:b.status,notes:b.notes}),
  sql:async(query,params)=>{call={query,params};return {rowCount:0,rows:[]}}
 });
 const res=await post({json:async()=>({submission_id:'submission-org-a',score:20,status:'rejected',notes:'test'})});
 assert.equal(res.status,404);
 assert.equal((await res.json()).error,'Submission not found');
 assert.deepEqual(call.params,[20,'rejected','test','reviewer-b','submission-org-a','org-b']);
 assert.ok(call.query.includes('i.org_id = $6'));
});

test('own-tenant review returns updated review row',async()=>{
 const updated={id:'submission-org-a',review_score:92,review_status:'shortlisted'};
 const post=reviewHandler({
  requireMe:async()=>({id:'reviewer-a',org_id:'org-a'}),
  validateReview:b=>({submissionId:b.submission_id,score:b.score,status:b.status,notes:''}),
  sql:async()=>({rowCount:1,rows:[updated]})
 });
 const res=await post({json:async()=>({submission_id:'submission-org-a',score:92,status:'shortlisted'})});
 assert.equal(res.status,200);
 assert.deepEqual((await res.json()).review,updated);
});
