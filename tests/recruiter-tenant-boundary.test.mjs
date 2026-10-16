import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const submissions=readFileSync(new URL('../app/api/recruiter/submissions/route.js',import.meta.url),'utf8');
const review=readFileSync(new URL('../app/api/review/route.js',import.meta.url),'utf8');

test('submissions require authenticated recruiter and tenant-scoped database query',()=>{
 assert.match(submissions,/await requireMe\(\)/);
 assert.match(submissions,/JOIN invitations v ON v\.id=s\.invitation_id/);
 assert.match(submissions,/JOIN interviews i ON i\.id=v\.interview_id/);
 assert.match(submissions,/WHERE i\.org_id=\$1/);
 assert.match(submissions,/\[recruiter\.org_id\]/);
 assert.match(submissions,/no-store/);
});
test('review updates cannot cross tenant boundary',()=>{
 assert.match(review,/await requireMe\(\)/);
 assert.match(review,/s\.invitation_id = v\.id/);
 assert.match(review,/i\.org_id = \$6/);
 assert.match(review,/recruiter\.org_id/);
 assert.match(review,/status:404/);
});

test('HR queue sorts by actual completion timestamp, not random UUID',()=>{
 assert.match(submissions,/ORDER BY s\.completed_at DESC, s\.id DESC/);
});

test('review endpoint cannot leak submission on unauthorized tenant',()=>{
 assert.match(review,/WHERE s\.id = \$5/);
 assert.match(review,/i\.org_id = \$6/);
 assert.match(review,/Submission not found/);
});
