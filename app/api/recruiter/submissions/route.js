import {sql} from '../../../../lib/db';
import {requireMe,fail} from '../../../../lib/auth';

export async function GET(){
 try{
  const recruiter=await requireMe();
  const result=await sql(`
   SELECT s.id,s.invitation_id,s.review_score,s.review_status,s.reviewed_at,
          v.email AS candidate_email,v.candidate_name,i.role,i.id AS interview_id
   FROM submissions s
   JOIN invitations v ON v.id=s.invitation_id
   JOIN interviews i ON i.id=v.interview_id
   WHERE i.org_id=$1
   ORDER BY s.id DESC LIMIT 100
  `,[recruiter.org_id]);
  return Response.json({submissions:result.rows},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return fail(error)}
}
