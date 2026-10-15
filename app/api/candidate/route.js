import { sql } from '../../../lib/db';
import { hash, fail } from '../../../lib/auth';
import {validateAnswers,validateInvitationToken,validateInterviewWindow,validateActiveSession} from '../../../lib/candidate-validation.mjs';

async function readInvite(rawToken) {
  const hashed = hash(validateInvitationToken(rawToken));
  const result = await sql(`SELECT v.id,v.status,v.scheduled_at,v.expires_at,
    i.role,i.duration_minutes,i.questions,v.started_at
    FROM invitations v JOIN interviews i ON i.id=v.interview_id
    WHERE v.token_hash=$1`,[hashed]);
  const invite = result.rows[0];
  validateInterviewWindow(invite);
  return invite;
}

export async function GET(req) {
  try {
    const invite = await readInvite(new URL(req.url).searchParams.get('token'));
    return Response.json({interview:{role:invite.role,duration:invite.duration_minutes,questions:invite.questions,scheduled_at:invite.scheduled_at,started_at:invite.started_at,server_time:new Date().toISOString()}});
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const invite = await readInvite(body.token);
    validateAnswers(body.answers,invite.questions.length);
    validateActiveSession(invite);
    const switches = Math.max(0,Math.min(9999,Math.trunc(Number(body.tab_switches)||0)));
    // This single statement prevents duplicate submissions competing across requests.
    // A unique key on submissions.invitation_id prevents repeated writes even under races.
    const result = await sql(`WITH claimed AS (
      UPDATE invitations SET status='completed'
      WHERE id=$1 AND status='invited' AND expires_at > now()
        AND (scheduled_at IS NULL OR scheduled_at <= now() + interval '15 minutes')
        AND started_at IS NOT NULL
        AND now() <= started_at + (SELECT duration_minutes FROM interviews WHERE id=interview_id) * interval '1 minute' + interval '60 seconds'
      RETURNING id
    ), stored AS (
      INSERT INTO submissions(invitation_id,answers,tab_switches)
      SELECT id,$2::jsonb,$3 FROM claimed
      ON CONFLICT (invitation_id) DO NOTHING
      RETURNING id
    ) SELECT id FROM stored`,[invite.id,JSON.stringify(body.answers),switches]);
    if (!result.rowCount) return Response.json({error:'Assessment already submitted or closed'}, {status:409});
    return Response.json({ok:true});
  } catch (e) { return fail(e); }
}
