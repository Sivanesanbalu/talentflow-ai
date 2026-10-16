// Synthetic staging E2E runner. Requires an authenticated HTTP client, not a Vercel share-link GET fetch.
// Explicit opt-in only. Refuses production domains and avoids sending external emails.
import { randomUUID } from 'node:crypto';

const base=process.env.TALENTFLOW_STAGING_URL;
const allowed=/^https:\/\/talentflow-ai-interviews-[a-z0-9]+-sivas-projects-f0d9f6a6\.vercel\.app\/?$/;
if (process.env.ALLOW_SYNTHETIC_WRITES!=='yes' || !base || !allowed.test(base)) {
  console.error('REFUSED: set an exact Vercel preview URL and ALLOW_SYNTHETIC_WRITES=yes.');
  process.exit(2);
}
const root=new URL(base);
const bypass=process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (!bypass) {
 console.error('REFUSED: preview test authentication is required.');
 process.exit(2);
}
let cookie='';
async function call(path,options={}) {
  const url=new URL(path,root);
  if(url.origin!==root.origin)throw Error('Unexpected redirect origin');
  const response=await fetch(url,{...options,redirect:'manual',headers:{
    'content-type':'application/json',...(bypass?{'x-vercel-protection-bypass':bypass}:{}),...(cookie?{cookie}:{}),...options.headers
  },signal:AbortSignal.timeout(15000)});
  if(response.status>=300 && response.status<400) throw Error('Unexpected redirect: '+response.status);
  const setCookie=response.headers.get('set-cookie');
  if(setCookie && setCookie.startsWith('tf_session='))cookie=setCookie.split(';',1)[0];
  const body=await response.json().catch(()=>null);
  if(!response.ok)throw Error(path+' returned HTTP '+response.status+': '+JSON.stringify(body).slice(0,180));
  return body;
}
const suffix=randomUUID().slice(0,12);
const email='tf-synthetic-'+suffix+'@example.invalid';
const password='Synthetic!'+randomUUID()+'#safe';
const res=await call('/api/health');
if(res.status!=='healthy')throw Error('Preview unhealthy');
const anon=await call('/api/auth');
if(anon.user!==null)throw Error('Test requires an anonymous start');
// Protected recruiter queue must reject an anonymous session.
const anonymousQueue=await fetch(new URL('/api/recruiter/submissions',root),{
 redirect:'manual',headers:{'x-vercel-protection-bypass':bypass},
 signal:AbortSignal.timeout(15000)
});
if(anonymousQueue.status!==401)throw Error('Anonymous recruiter queue returned '+anonymousQueue.status+' (expected 401)');
await call('/api/auth',{method:'POST',body:JSON.stringify({action:'register',email,password,organization:'Synthetic QA '+suffix})});
const auth=await call('/api/auth');
if(!auth.user?.id)throw Error('Recruiter login session unavailable');
const interviews=await call('/api/interviews',{method:'POST',body:JSON.stringify({
 role:'Synthetic QA Engineer '+suffix,description:'Synthetic test interview to validate staging-only recruiter workflows.',duration_minutes:30
})});
if(!interviews.interview?.id)throw Error('Interview ID missing');
const candidate=await call('/api/invitations',{method:'POST',body:JSON.stringify({
 interview_id:interviews.interview.id,email:'candidate-'+suffix+'@example.invalid',
 name:'Synthetic Candidate',send_email:false
})});
if(!candidate.url)throw Error('Private invite URL missing');
const token=new URL(candidate.url).searchParams.get('invite');
if(!token)throw Error('Invite token missing');
// Do not emit token, session cookie or passwords to CI logs.
const assessment=await call('/api/candidate?token='+encodeURIComponent(token));
if(!Array.isArray(assessment.interview?.questions))throw Error('Candidate questions missing');
const start=await call('/api/candidate/start',{method:'POST',body:JSON.stringify({token})});
if(!start.started_at)throw Error('Assessment start was not recorded');
const answers=assessment.interview.questions.map((q,i)=>'Synthetic staging-only answer '+(i+1)+' with sufficient detail for a functional submission.');
await call('/api/candidate',{method:'POST',body:JSON.stringify({token,answers,tab_switches:0})});
const submissionList=await call('/api/recruiter/submissions');
const mine=submissionList.submissions?.find(s=>s.candidate_email==='candidate-'+suffix+'@example.invalid');
if(!mine?.id) throw Error('Submitted assessment missing in recruiter review queue');
const reviewed=await call('/api/review',{method:'POST',body:JSON.stringify({
 submission_id:mine.id,score:82,status:'reviewed',notes:'Synthetic staging-only QA review'
})});
if(reviewed.review?.id!==mine.id) throw Error('HR review update was not confirmed');
console.log('PASS staging: recruiter submission lookup and HR review');
console.log('PASS staging: health → recruiter registration → interview → private invitation → assessment start → submission');
console.log('Note: synthetic records remain in staging database; no real email was sent. Human review requires an authenticated submission lookup.');

// Cross-organization isolation check using an independent synthetic recruiter.
cookie='';
await call('/api/auth',{method:'POST',body:JSON.stringify({action:'register',email:'tf-other-'+suffix+'@example.invalid',password:'Synthetic!'+randomUUID()+'#safe',organization:'Separate QA '+suffix})});
const other=await call('/api/interviews');
if(!Array.isArray(other.interviews)||other.interviews.some(row=>row.id===interviews.interview.id))throw Error('Cross-tenant interview disclosure');
const otherSubmissions=await call('/api/recruiter/submissions');
if(!Array.isArray(otherSubmissions.submissions) ||
 otherSubmissions.submissions.some(s=>s.id===mine.id))
 throw Error('Cross-tenant submission disclosure');
const denied=await fetch(new URL('/api/review',root),{method:'POST',redirect:'manual',
 headers:{'content-type':'application/json','x-vercel-protection-bypass':bypass,cookie},
 body:JSON.stringify({submission_id:mine.id,score:11,status:'rejected',notes:'Synthetic unauthorized review'}),
 signal:AbortSignal.timeout(15000)});
if(denied.status!==404)throw Error('Cross-tenant review must return 404, got '+denied.status);
console.log('PASS staging: cross-tenant submission and review isolation');
const otherInvites=await call('/api/invitations');
if(!Array.isArray(otherInvites.invitations)||otherInvites.invitations.some(row=>row.email==='candidate-'+suffix+'@example.invalid'))throw Error('Cross-tenant invitation disclosure');
console.log('PASS staging: tenant separation for interview and invitation lists');
