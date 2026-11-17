import assert from 'node:assert/strict';
import test from 'node:test';
import { connectNotebook } from '../frontend/src/notebook-sync.ts';

test('keeps the old revision of a conflicting draft even after more local edits', async (t) => {
  const key = 'kotoba.notebook.pending.v1';
  const draft = { revision: 1, notebook: { words: ['mine'] } };
  const storage = new Map([[key, JSON.stringify(draft)]]);
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (name) => storage.get(name),
    setItem: (name, value) => storage.set(name, value),
    removeItem: (name) => storage.delete(name),
  } });
  t.after(() => { delete globalThis.sessionStorage; });
  const requests = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ revision: 2, notebook: { words: ['server'] } }));
  const connect = () => connectNotebook({ saved: {}, enabled: true, onStatus() {} });
  const sync = await connect();
  assert.equal(sync.status, 'conflict');
  assert.deepEqual(sync.saved, draft.notebook);
  sync.save({ words: ['mine', 'new'] });
  assert.equal(JSON.parse(storage.get(key)).revision, 1);
  const reloaded = await connect();
  assert.equal(reloaded.status, 'conflict');
  assert.deepEqual(reloaded.saved.words, ['mine', 'new']);
  assert.equal(requests.mock.callCount(), 2);
});
