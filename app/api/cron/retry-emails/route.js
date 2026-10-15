import {sql} from '../../../../lib/db';
import {deliverEmail} from '../../../../lib/email.mjs';
import {delayMinutes,MAX_ATTEMPTS} from '../../../../lib/retry.mjs';
export async function GET(req){
 const secret=process.env.CRON_SECRET;
 if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return Response.json({error:'Unauthorized'},{status:401});
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return Response.json({status:'disabled',reason:'Provider not configured'});
 let attempted=0,sent=0,failed=0;
 try{
  // Each claim is atomic; a pending row is eligible only after its lease expires.
  for(let n=0;n<30;n++){
   const r=await sql(`WITH candidate AS (
      SELECT d.id FROM email_deliveries d JOIN invitations v ON v.id=d.invitation_id
      WHERE d.status IN ('failed','pending') AND d.attempts < $1 AND d.next_attempt_at <= now()
        AND v.status='invited' AND v.expires_at>now()
      ORDER BY d.next_attempt_at,d.created_at FOR UPDATE OF d SKIP LOCKED LIMIT 1
    ) UPDATE email_deliveries d SET status='pending',attempts=d.attempts+1,
      next_attempt_at=now()+interval '3 minutes',updated_at=now()
    FROM candidate c WHERE d.id=c.id RETURNING d.id,d.invitation_id,d.kind,d.recipient,d.attempts`,[MAX_ATTEMPTS]);
   if(!r.rowCount)break;
   const item=r.rows[0];attempted++;
   // The secure invite URL cannot be reconstructed from a hashed token.
   // Never retry a link-bearing invitation unless an encrypted template/link has been retained.
   if(item.kind==='invitation'){
    await sql(`UPDATE email_deliveries SET status='failed',last_error='Invitation retry requires reissued secure link',
      attempts=$2,next_attempt_at=now()+interval '100 years',updated_at=now() WHERE id=$1 AND attempts=$2 AND status NOT IN ('delivered','bounced','complained')`,[item.id,MAX_ATTEMPTS]);failed++;continue;
   }
   const context=(await sql(`SELECT v.candidate_name,v.scheduled_at,i.role FROM invitations v
     JOIN interviews i ON i.id=v.interview_id WHERE v.id=$1 AND v.status='invited'`,[item.invitation_id])).rows[0];
   if(!context||!context.scheduled_at){
    await sql(`UPDATE email_deliveries SET status='failed',last_error='No valid scheduled interview',attempts=$2,
      next_attempt_at=now()+interval '100 years',updated_at=now() WHERE id=$1 AND attempts=$2`,[item.id,MAX_ATTEMPTS]);failed++;continue;
   }
   const msg={to:item.recipient,subject:`Interview reminder: ${context.role}`,
    text:`Hello ${context.candidate_name||'Candidate'}, your ${context.role} interview is scheduled for ${new Date(context.scheduled_at).toISOString()} UTC. Use the original private invitation link or contact your recruiter.`,
    idempotencyKey:`talentflow-reminder-${item.invitation_id}`};
   let result;try{result=await deliverEmail(msg)}catch{result={status:'failed',providerId:null}}
   const success=result.status==='sent';
   await sql(`UPDATE email_deliveries SET status=$1,provider_message_id=COALESCE($2,provider_message_id),
      sent_at=CASE WHEN $1='sent' THEN now() ELSE sent_at END,
      last_error=CASE WHEN $1='sent' THEN NULL ELSE 'Provider send failed' END,
      next_attempt_at=CASE WHEN $1='sent' THEN now()+interval '100 years'
      ELSE now()+($3::integer * interval '1 minute') END,updated_at=now()
      WHERE id=$4 AND attempts=$5 AND status NOT IN ('delivered','bounced','complained')`,[success?'sent':'failed',result.providerId,delayMinutes(item.attempts),item.id,item.attempts]);
   if(success)sent++;else failed++;
  }
  return Response.json({status:'ok',attempted,sent,failed});
 }catch{return Response.json({error:'Retry processing failed',attempted},{status:503})}
}
