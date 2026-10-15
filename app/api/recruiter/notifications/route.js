import{sql}from'../../../../lib/db';import{requireMe,fail}from'../../../../lib/auth';
export async function GET(){try{const u=await requireMe();const r=await sql(`SELECT d.id,d.invitation_id,d.kind,d.status,d.recipient,d.attempts,d.last_error,
 d.created_at,d.sent_at,i.role FROM email_deliveries d JOIN invitations v ON v.id=d.invitation_id
 JOIN interviews i ON i.id=v.interview_id WHERE i.org_id=$1
 AND d.status IN ('failed','bounced','complained','not_configured')
 ORDER BY d.created_at DESC LIMIT 100`,[u.org_id]);return Response.json({notifications:r.rows})}catch(e){return fail(e)}}
