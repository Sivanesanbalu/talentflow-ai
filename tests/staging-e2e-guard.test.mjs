import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../scripts/staging-e2e.mjs',import.meta.url));
const cases=[
 ['production domain','https://talentflow-ai-interviews.vercel.app','yes'],
 ['lookalike host','https://talentflow-ai-interviews-abc-sivas-projects-f0d9f6a6.vercel.app.evil.test','yes'],
 ['localhost','http://localhost:3000','yes'],
 ['missing preview authentication','https://talentflow-ai-interviews-3q3mduzic-sivas-projects-f0d9f6a6.vercel.app','yes'],
 ['write opt-in disabled','https://talentflow-ai-interviews-3q3mduzic-sivas-projects-f0d9f6a6.vercel.app','no']
];
for(const [label,url,permission] of cases){
 test('staging E2E refuses '+label,()=>{
  const result=spawnSync(process.execPath,[script],{env:{...process.env,TALENTFLOW_STAGING_URL:url,ALLOW_SYNTHETIC_WRITES:permission,VERCEL_AUTOMATION_BYPASS_SECRET:label==='missing preview authentication'?'':'placeholder'},encoding:'utf8',timeout:5000});
  assert.equal(result.status,2);
  assert.match(result.stderr,/REFUSED/);
 });
}
