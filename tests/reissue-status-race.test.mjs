import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/api/invitations/reissue/route.js',import.meta.url),'utf8');
test('reissued invitation clears prior provider correlation',()=>{
 assert.match(source,/provider_message_id=NULL/);
});
test('reissue finalization does not clobber terminal provider status',()=>{
 assert.match(source,/WHERE invitation_id=\$3 AND kind='invitation' AND status='pending'/);
});
test('reissue remains tenant-scoped and requires email provider',()=>{
 assert.match(source,/i\.org_id=\$3/);
 assert.match(source,/RESEND_API_KEY/);
});
