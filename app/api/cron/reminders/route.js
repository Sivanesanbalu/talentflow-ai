import{sql}from'../../../../lib/db';import{deliverEmail}from'../../../../lib/email.mjs';
export async function GET(req){
 const secret=process.env.CRON_SECRET;
 if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return Response.json({error:'Unauthorized'},{status:401});
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return Response.json({status:'disabled',reason:'Email provider not configured'});
 try{
  const list=await sql(`SELECT v.id,v.email,v.candidate_name,v.scheduled_at,i.role
   FROM invitations v JOIN interviews i ON i.id=v.interview_id
   WHERE v.status='invited' AND v.scheduled_at>now() + interval '23 hours'
     AND v.scheduled_at<=now() + interval '25 hours'
     AND NOT EXISTS(SELECT 1 FROM email_deliveries d WHERE d.invitation_id=v.id AND d.kind='reminder') LIMIT 50`);
  let sent=0,failed=0;
  for(const item of list.rows){
   // Claim-before-send makes job retries idempotent and prevents simultaneous sends.
   const claim=await sql(`INSERT INTO email_deliveries(invitation_id,kind,status,recipient)
    VALUES($1,'reminder','pending',$2) ON CONFLICT (invitation_id,kind) DO NOTHING RETURNING id`,[item.id,item.email]);
   if(!claim.rowCount)continue;
   const msg={to:item.email,subject:`Interview reminder: ${item.role}`,text:`Hello ${item.candidate_name||'Candidate'}, your ${item.role} interview is scheduled for ${new Date(item.scheduled_at).toISOString()} UTC. Open the secure invitation link from your original email. If you cannot find it, ask the recruiter to resend a new link.`};
   let result;try{result=await deliverEmail({...msg,idempotencyKey:"talentflow-reminder-"+item.id})}catch{result={status:'failed',providerId:null}}
   await sql("UPDATE email_deliveries SET status=$1,provider_message_id=$2,sent_at=CASE WHEN $1=$3 THEN now() ELSE NULL END,attempts=1,next_attempt_at=CASE WHEN $1=$3 THEN now()+interval '100 years' ELSE now()+interval '5 minutes' END WHERE id=$4",[result.status,result.providerId,'sent',claim.rows[0].id]);
   if(result.status==='sent')sent++;else failed++;
  }
  return Response.json({status:'ok',sent,failed});
 }catch{return Response.json({error:'Reminder processing failed'},{status:503})}
}
