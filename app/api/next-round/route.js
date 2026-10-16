import {invitationLink} from '../../../lib/invitation-origin.mjs';
import { sql } from '../../../lib/db';
import { requireMe, fail, token, hash } from '../../../lib/auth';

export async function POST(req) {
  try {
    const recruiter = await requireMe();
    const { invitation_id: invitationId } = await req.json();
    const secret = token();
    // A single SQL INSERT enforces org ownership, reviewed decision, round limit,
    // and duplicate next-round prevention (with a unique DB index).
    const inserted = await sql(`
      INSERT INTO invitations (
        interview_id, email, candidate_name, token_hash, expires_at,
        stage, parent_invitation_id
      )
      SELECT v.interview_id, v.email, v.candidate_name, $3,
             now() + interval '30 days', v.stage + 1, v.id
      FROM invitations v
      JOIN interviews i ON i.id = v.interview_id
      JOIN submissions s ON s.invitation_id = v.id
      WHERE v.id = $1
        AND i.org_id = $2
        AND s.review_status = 'next_round'
        AND v.stage < 5
        AND NOT EXISTS (SELECT 1 FROM invitations child WHERE child.parent_invitation_id = v.id)
      RETURNING id, email, stage
    `, [invitationId, recruiter.org_id, hash(secret)]);
    if (!inserted.rowCount) {
      return Response.json({error:'Next round not authorized, already created, or limit reached'}, {status:409});
    }
    const entry = inserted.rows[0];
    return Response.json({
      email:entry.email,
      stage:entry.stage,
      invitation_url:invitationLink(secret),
      delivery:'manual_email_required'
    }, {status:201,headers:{'Cache-Control':'private, no-store'}});
  } catch (e) {
    if (e.code === '23505') return Response.json({error:'Next round already created'}, {status:409});
    return fail(e);
  }
}
