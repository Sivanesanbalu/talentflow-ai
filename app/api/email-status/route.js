import{sql}from'../../../lib/db';import{requireMe,fail}from'../../../lib/auth';
export async function GET(){try{const u=await requireMe();
 const r=await sql(`SELECT d.id,d.kind,d.status,d.recipient,d.attempts,d.last_error,d.next_attempt_at,d.created_at,d.sent_at,i.role
 FROM email_deliveries d JOIN invitations v ON v.id=d.invitation_id
 JOIN interviews i ON i.id=v.interview_id WHERE i.org_id=$1 ORDER BY d.created_at DESC LIMIT 200`,[u.org_id]);
 const totals=r.rows.reduce((acc,row)=>{acc[row.status]=(acc[row.status]||0)+1;return acc},{})
 return Response.json({deliveries:r.rows,counts:totals})}catch(e){return fail(e)}}
