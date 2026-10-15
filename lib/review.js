export const DECISIONS = new Set(['reviewed','shortlisted','next_round','rejected']);
const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export function validateReview(input) {
  const score = input?.score;
  const status = input?.status;
  const submissionId = String(input?.submission_id || '');
  const notes = String(input?.notes ?? '').trim();
  if (!UUID_RE.test(submissionId)) throw new Error('Invalid submission ID');
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100)
    throw new Error('Score must be a number from 0 to 100');
  if (!DECISIONS.has(status)) throw new Error('Invalid review decision');
  if (notes.length > 5000) throw new Error('Review notes exceed 5000 characters');
  return { score, status, submissionId, notes };
}
