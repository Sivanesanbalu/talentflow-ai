import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../scripts/staging-e2e.mjs',import.meta.url),'utf8');
test('staging E2E error reports never interpolate token-bearing path',()=>{
 assert.match(source,/Error\(url\.pathname\+' returned HTTP '/);
 assert.doesNotMatch(source,/Error\(path\+' returned HTTP '/);
});
test('staging E2E never prints private invitation values intentionally',()=>{
 assert.doesNotMatch(source,/console\.log\([^\n]*(?:token|candidate\.url|cookie|password)/i);
});
