import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const runner=fileURLToPath(new URL('../scripts/db-integration.mjs',import.meta.url));
const base={
 ALLOW_SYNTHETIC_DB_WRITES:'yes',
 TALENTFLOW_ISOLATED_BRANCH_ID:'br-polished-fog-a114c934',
 TALENTFLOW_ISOLATED_DB_URL:'postgresql://synthetic:synthetic@ep-misty-sea-a1smdlcw.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
};
function refused(overrides){
 const env={...process.env,...base,...overrides};
 const result=spawnSync(process.execPath,[runner],{env,encoding:'utf8',timeout:5000});
 assert.equal(result.status,2,result.stderr);
 assert.match(result.stderr,/REFUSED/);
}
test('isolation runner refuses missing explicit approval',()=>refused({ALLOW_SYNTHETIC_DB_WRITES:'no'}));
test('isolation runner refuses unrelated branch identifier',()=>refused({TALENTFLOW_ISOLATED_BRANCH_ID:'br-gentle-wave-a1zjmush'}));
test('isolation runner refuses unrelated database endpoint',()=>refused({TALENTFLOW_ISOLATED_DB_URL:'postgresql://synthetic:synthetic@ep-elsewhere.neon.tech/neondb?sslmode=require'}));
test('isolation runner refuses transport without required TLS',()=>refused({TALENTFLOW_ISOLATED_DB_URL:'postgresql://synthetic:synthetic@ep-misty-sea-a1smdlcw.ap-southeast-1.aws.neon.tech/neondb'}));
test('isolation runner refuses missing password',()=>refused({TALENTFLOW_ISOLATED_DB_URL:'postgresql://synthetic@ep-misty-sea-a1smdlcw.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'}));
