import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createKotobaServer } from '../backend/server.js';

async function listen(databasePath) {
  const server = createKotobaServer({ databasePath });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) };
}

const word = { id: 'user-1', kana: 'いぬ', meaning: 'con chó', kanji: '犬' };
const notebook = { words: [word], known: [word.id], speed: 1, repeats: 2, wordGap: 500, showKana: false, showMeaning: true };

function put(base, revision, data, headers = {}) {
  return fetch(`${base}/api/notebook`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ revision, notebook: data }),
  });
}

test('persists notebook across server restarts and rejects stale revisions', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'kotoba-test-'));
  const path = join(directory, 'kotoba.sqlite');
  let server = await listen(path);
  t.after(async () => {
    await server.close();
    await rm(directory, { recursive: true, force: true });
  });
  const api = () => fetch(`${server.base}/api/notebook`).then((response) => response.json());
  assert.deepEqual(await api(), { revision: 0, notebook: null });
  const first = await put(server.base, 0, notebook, { Origin: server.base });
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { revision: 1 });
  const latest = { ...notebook, speed: 1.2 };
  const competing = await Promise.all([put(server.base, 1, latest), put(server.base, 1, { ...notebook, speed: 0.6 })]);
  assert.deepEqual(competing.map(({ status }) => status).sort(), [200, 409]);
  const stored = await api();
  assert.equal(stored.revision, 2);
  const conflict = await put(server.base, 1, { ...notebook, words: [], known: [] });
  assert.equal(conflict.status, 409);
  assert.deepEqual(await conflict.json(), stored);
  await server.close();
  server = await listen(path);
  assert.deepEqual(await api(), stored);
});

test('validates input, rejects cross-origin writes, and serves only frontend files', async (t) => {
  const server = await listen(':memory:');
  t.after(server.close);
  assert.equal((await put(server.base, 0, notebook, { Origin: 'https://example.org' })).status, 403);
  assert.equal((await put(server.base, 0, { ...notebook, known: ['missing-id'] })).status, 422);
  assert.equal((await put(server.base, 0, { ...notebook, words: [word, word] })).status, 422);
  assert.equal((await fetch(`${server.base}/backend/storage/kotoba.sqlite`)).status, 404);
  assert.equal((await fetch(`${server.base}/data/n5.json`)).status, 200);
  assert.match(await fetch(server.base).then((response) => response.text()), /name="kotoba-backend"/);
});
