import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

function routeSource(path){return readFileSync(new URL(path,import.meta.url),'utf8');}

test('session identity GET response is private and not cached',async()=>{
 const source=routeSource('../app/api/auth/route.js')
  .replace(/^import .*;?$/gm,'').replace('export async function GET()','async function GET()');
 const get=new Function('me','Response',source.slice(0,source.indexOf('export async function POST'))+'\nreturn GET')(
  async()=>({id:'synthetic',org_id:'test-org'}),Response);
 const result=await get();
 assert.equal(result.headers.get('cache-control'),'private, no-store');
 assert.equal((await result.json()).user.org_id,'test-org');
});

test('tenant invitation GET response is private and not cached',()=>{
 const source=routeSource('../app/api/invitations/route.js');
 assert.match(source,/Cache-Control':'private, no-store'/);
 assert.match(source,/WHERE i\.org_id=\$1/);
});
