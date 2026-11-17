import assert from 'node:assert/strict';
import test from 'node:test';
import { createDailySitrepResolver, selectDailySitrep } from '../src/lib/daily-sitrep.ts';
const key = { date: '2026-11-12', serviceRecordId: 'alex' };

test('parallel same-owner/date readers create exactly once and retain saved work', async () => {
  let page = null, creates = 0;
  const resolve = createDailySitrepResolver({find: async () => page, create: async () => { creates++; page={id:'saved',Study:true}; }});
  const results = await Promise.all(Array.from({length:30},()=>resolve(key)));
  assert.equal(creates,1);assert.ok(results.every(r=>r===page));
  assert.equal(await resolve(key),page);assert.equal(creates,1);
});
test('date and owner have separate tasks, including a midnight boundary', async () => {
  const pages=new Map();let creates=0;
  const id=k=>JSON.stringify(k);
  const resolve=createDailySitrepResolver({find:async k=>pages.get(id(k))??null,create:async k=>{creates++;pages.set(id(k),{...k});}});
  const keys=[key,{...key,date:'2026-11-13'},{...key,serviceRecordId:'other'}];
  assert.deepEqual(await Promise.all(keys.map(k=>resolve(k))),keys);assert.equal(creates,3);
});
test('another writer becoming visible before creation is reused', async () => {
  let reads=0;const page={id:'other-writer'};
  const resolve=createDailySitrepResolver({find:async()=>++reads===1?null:page,create:async()=>assert.fail('must not create')});
  assert.equal(await resolve(key),page);
});
test('ambiguous create timeout recovers committed row without another write', async () => {
  let page=null,writes=0;
  const resolve=createDailySitrepResolver({find:async()=>page,create:async()=>{writes++;page={id:'committed'};throw Error('timeout');}});
  assert.equal((await resolve(key)).id,'committed');assert.equal(writes,1);
});
test('failed tasks release for recovery and unverified writes cannot report success', async () => {
  let fail=true,page=null;
  const resolve=createDailySitrepResolver({find:async()=>page,create:async()=>{if(fail)throw Error('offline');page={id:'retry'};}});
  await assert.rejects(resolve(key),/offline/);fail=false;assert.equal((await resolve(key)).id,'retry');
  await assert.rejects(createDailySitrepResolver({find:async()=>null,create:async()=>{}})(key),/did not verify/);
});
test('cross-instance duplicate evidence blocks reads and subsequent writes', async () => {
  assert.equal(selectDailySitrep([]),null);
  assert.throws(()=>selectDailySitrep([{id:'one'},{id:'two'}]),/Duplicate/);
  const resolve=createDailySitrepResolver({find:async()=>selectDailySitrep([{},{}]),create:async()=>assert.fail('must not write')});
  await assert.rejects(resolve(key),/Duplicate/);
});
