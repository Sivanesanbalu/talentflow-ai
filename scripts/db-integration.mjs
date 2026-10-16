// Isolated-branch PostgreSQL integration check; NEVER run against staging/production.
import {randomUUID} from 'node:crypto';

const APPROVED_BRANCH='br-polished-fog-a114c934';
const APPROVED_HOSTS=new Set(['ep-misty-sea-a1smdlcw.ap-southeast-1.aws.neon.tech','ep-misty-sea-a1smdlcw-pooler.ap-southeast-1.aws.neon.tech']);
const branch=process.env.TALENTFLOW_ISOLATED_BRANCH_ID||'';
const url=process.env.TALENTFLOW_ISOLATED_DB_URL;
let parsed;
try { parsed=new URL(url); } catch { /* refused below */ }
if(process.env.ALLOW_SYNTHETIC_DB_WRITES!=='yes' ||
 branch!==APPROVED_BRANCH ||
 !parsed || !['postgres:','postgresql:'].includes(parsed.protocol) ||
 !APPROVED_HOSTS.has(parsed.hostname) ||
 parsed.port && parsed.port!=='5432' ||
 !parsed.username || !parsed.password || !parsed.pathname ||
 parsed.searchParams.get('sslmode')!=='require') {
 console.error('REFUSED: approved isolated branch hostname, TLS and explicit opt-in required');
 process.exit(2);
}
// The pinned hostname is resolved from Neon branch compute metadata, not user input.
// Use a dedicated short-lived least-privileged connection; never pass production credentials.
const {default:pg}=await import('pg');
const client=new pg.Client({connectionString:url,connectionTimeoutMillis:8000});
let invitationId;
try {
 await client.connect();
 const id=randomUUID().slice(0,12);
 await client.query('BEGIN');
 const org=(await client.query('INSERT INTO organizations(name) VALUES($1) RETURNING id',['DB integration '+id])).rows[0];
 const rec=(await client.query('INSERT INTO recruiters(org_id,email,password_hash) VALUES($1,$2,$3) RETURNING id',[org.id,'integration-'+id+'@example.invalid','not-a-real-login'])).rows[0];
 const interview=(await client.query("INSERT INTO interviews(org_id,created_by,role,description,duration_minutes,level,questions) VALUES($1,$2,'Synthetic Test','DB-only synthetic check',30,'Junior','[]'::jsonb) RETURNING id",[org.id,rec.id])).rows[0];
 invitationId=(await client.query("INSERT INTO invitations(interview_id,email,token_hash,expires_at,started_at) VALUES($1,$2,$3,now()+interval '1 hour',now()) RETURNING id",[interview.id,'candidate@example.invalid',randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','')])).rows[0].id;
 const query=`WITH claimed AS (UPDATE invitations SET status='completed' WHERE id=$1 AND status='invited' AND started_at IS NOT NULL RETURNING id), stored AS (INSERT INTO submissions(invitation_id,answers,tab_switches) SELECT id,'["test"]'::jsonb,0 FROM claimed ON CONFLICT(invitation_id) DO NOTHING RETURNING id) SELECT id FROM stored`;
 const first=await client.query(query,[invitationId]);
 const second=await client.query(query,[invitationId]);
 if(first.rowCount!==1||second.rowCount!==0) throw Error('Duplicate submission protection failed');
 const forbidden=await client.query(`UPDATE submissions s SET review_status='rejected' FROM invitations v JOIN interviews i ON i.id=v.interview_id WHERE s.invitation_id=v.id AND s.invitation_id=$1 AND i.org_id=$2 RETURNING s.id`,[invitationId,randomUUID()]);
 if(forbidden.rowCount!==0)throw Error('Foreign tenant review permitted');
 const owner=await client.query(`UPDATE submissions s SET review_status='reviewed' FROM invitations v JOIN interviews i ON i.id=v.interview_id WHERE s.invitation_id=v.id AND s.invitation_id=$1 AND i.org_id=$2 RETURNING s.id`,[invitationId,org.id]);
 if(owner.rowCount!==1)throw Error('Owner review not applied');
 console.log('PASS: duplicate prevented; foreign review denied; owning organization review allowed');
 await client.query('ROLLBACK'); // transaction-scoped synthetic data is always discarded
} catch(e) {
 await client.query('ROLLBACK').catch(()=>{});
 console.error('FAIL:',e.code||e.message);
 process.exitCode=1;
} finally {
 await client.end().catch(()=>{});
}
