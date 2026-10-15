import { sql } from '../../../lib/db';
import { requireMe, fail } from '../../../lib/auth';

export async function GET(req) {
  try {
    const recruiter = await requireMe();
    const id = new URL(req.url).searchParams.get('interview_id');
    if (!/^[0-9a-f-]{36}$/i.test(id || '')) throw new Error('Invalid interview ID');
    const result = await sql(`
      SELECT v.id AS invitation_id, s.id AS submission_id, s.answers, v.candidate_name, v.email, v.stage,
             s.review_score, s.review_status, s.reviewer_notes, s.reviewed_at
      FROM invitations v
      JOIN interviews i ON i.id = v.interview_id
      LEFT JOIN submissions s ON s.invitation_id = v.id
      WHERE i.id = $1 AND i.org_id = $2
      ORDER BY s.review_score DESC NULLS LAST, s.reviewed_at DESC NULLS LAST, v.created_at ASC
    `,[id,recruiter.org_id]);
    return Response.json({rankings:result.rows, ranking_basis:'human_reviewed_scores_only'});
  } catch(e) { return fail(e); }
}
