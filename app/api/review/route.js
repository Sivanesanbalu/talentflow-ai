import { sql } from '../../../lib/db';
import { requireMe, fail } from '../../../lib/auth';
import { validateReview } from '../../../lib/review';

export async function POST(req) {
  try {
    const recruiter = await requireMe();
    const body = validateReview(await req.json());
    const result = await sql(`
      UPDATE submissions AS s
      SET review_score = $1,
          review_status = $2,
          reviewer_notes = $3,
          reviewed_by = $4,
          reviewed_at = now()
      FROM invitations AS v
      JOIN interviews AS i ON i.id = v.interview_id
      WHERE s.id = $5
        AND s.invitation_id = v.id
        AND i.org_id = $6
      RETURNING s.id, s.review_score, s.review_status, s.reviewed_at
    `, [body.score, body.status, body.notes, recruiter.id, body.submissionId, recruiter.org_id]);
    if (!result.rowCount) return Response.json({error:'Submission not found'}, {status:404});
    return Response.json({review:result.rows[0]});
  } catch(e) { return fail(e); }
}
