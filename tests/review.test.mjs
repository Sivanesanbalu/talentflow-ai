import assert from 'node:assert/strict';
import { validateReview } from '../lib/review.js';
const id = '82d7a600-8aef-4a7e-bdd9-90a5a4cfde12';
assert.equal(validateReview({submission_id:id, score:85, status:'shortlisted'}).score, 85);
assert.equal(validateReview({submission_id:id, score:0, status:'rejected'}).status, 'rejected');
for (const score of [-1,101,'88',NaN,Infinity]) {
  assert.throws(()=>validateReview({submission_id:id,score,status:'reviewed'}));
}
assert.throws(()=>validateReview({submission_id:id,score:80,status:'hired'}));
assert.throws(()=>validateReview({submission_id:'invalid',score:80,status:'reviewed'}));
assert.throws(()=>validateReview({submission_id:id,score:80,status:'reviewed',notes:'x'.repeat(5001)}));
console.log('Passed: review validation and score boundary cases');
