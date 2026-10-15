import{sql}from'../../../../lib/db';
import{requireMe,token,hash,fail}from'../../../../lib/auth';
import{deliverEmail,invitationEmail}from'../../../../lib/email.mjs';
import{validateReissueRequest}from'../../../../lib/invitation-recovery.mjs';
export async function POST(req){
 try{
  const u=await requireMe(),{id}=validateReissueRequest(await req.json());
  if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return Response.json({error:'Email provider not configured'},{status:503});
  const t=token();
  // Replacing the hash revokes the earlier link. Only unsent/failed invitations,
  // owned by this organization and not yet started, are eligible.
  const r=await sql(`UPDATE invitations v SET token_hash=$1,expires_at=now()+interval '30 days'
   FROM interviews i WHERE v.id=$2 AND v.interview_id=i.id AND i.org_id=$3
   AND v.status='invited' AND v.started_at IS NULL
   AND EXISTS(SELECT 1 FROM email_deliveries d WHERE d.invitation_id=v.id
    AND d.kind='invitation' AND d.status IN ('failed','bounced','not_configured'))
   RETURNING v.id,v.email,v.candidate_name,v.scheduled_at,i.role`,[hash(t),id,u.org_id]);
  if(!r.rowCount)return Response.json({error:'Invitation is not eligible for reissue'},{status:409});
  const inv=r.rows[0];
  // Record a distinct send attempt without duplicating the unique delivery row.
  await sql(`UPDATE email_deliveries SET status='pending',attempts=attempts+1,
   last_error=NULL,provider_message_id=NULL,updated_at=now() WHERE invitation_id=$1 AND kind='invitation'`,[inv.id]);
  const url=new URL('/interview-studio?invite='+t,req.url).toString();
  let result;try{result=await deliverEmail({to:inv.email,...invitationEmail({candidate:inv.candidate_name,role:inv.role,scheduledAt:inv.scheduled_at,url}),idempotencyKey:'talentflow-reissue-'+inv.id+'-'+hash(t).slice(0,16)})}catch{result={status:'failed',providerId:null}};
  await sql(`UPDATE email_deliveries SET status=$1,provider_message_id=$2,updated_at=now(),
   sent_at=CASE WHEN $1='sent' THEN now() ELSE NULL END WHERE invitation_id=$3 AND kind='invitation' AND status='pending'`,[result.status,result.providerId,inv.id]);
  // Never include a bearer invitation URL in the API response when emailing is enabled.
  return Response.json({delivery:result.status,reissued:true});
 }catch(e){return fail(e)}
}
