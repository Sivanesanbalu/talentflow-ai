export function validateAnswers(answers, expected) {
  if (!Array.isArray(answers) || !Number.isInteger(expected) || expected < 1 || expected > 100 || answers.length !== expected) {
    throw Error('Invalid answer count');
  }
  if (answers.some(answer => typeof answer !== 'string' || answer.length > 20000)) {
    throw Error('Invalid answer content');
  }
  return answers;
}
export function validateInvitationToken(token) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) throw Error('Invalid invitation token');
  return token;
}
export function validateInterviewWindow(invite, now = Date.now()) {
  if (!invite || invite.status !== 'invited') throw Error('Invitation is unavailable');
  if (Date.parse(invite.expires_at) <= now) throw Error('Invitation expired');
  if (invite.scheduled_at && Date.parse(invite.scheduled_at) - 15 * 60000 > now) throw Error('Interview is not open yet');
  return true;
}

export function validateActiveSession(invite, now = Date.now(), graceMs = 60_000) {
  validateInterviewWindow(invite, now);
  if (!invite.started_at || !Number.isFinite(Date.parse(invite.started_at))) throw Error('Assessment has not started');
  const duration = Number(invite.duration_minutes);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 240) throw Error('Invalid interview duration');
  if (now > Date.parse(invite.started_at) + duration * 60_000 + graceMs) throw Error('Assessment time has expired');
  return true;
}
