import {sql} from '../../../../lib/db';
import {hash,fail} from '../../../../lib/auth';
import {validateInvitationToken} from '../../../../lib/candidate-validation.mjs';

export async function POST(req) {
  try {
    const {token}=await req.json();
    const result=await sql(`UPDATE invitations v SET started_at=COALESCE(v.started_at,now())
      FROM interviews i
      WHERE v.interview_id=i.id AND v.token_hash=$1 AND v.status='invited'
        AND v.expires_at>now() AND (v.scheduled_at IS NULL OR v.scheduled_at<=now()+interval '15 minutes')
        AND (v.started_at IS NULL OR now() <= v.started_at + i.duration_minutes * interval '1 minute' + interval '60 seconds')
      RETURNING v.started_at,i.duration_minutes,now() AS server_time`,
      [hash(validateInvitationToken(token))]);
    if(!result.rowCount) return Response.json({error:'Assessment expired or unavailable'},{status:409});
    const r=result.rows[0];
    return Response.json({started_at:r.started_at,duration_minutes:r.duration_minutes,server_time:r.server_time},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return fail(e)}
}
