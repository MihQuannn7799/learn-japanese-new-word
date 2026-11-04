import assert from 'node:assert/strict';
import test from 'node:test';
import { createState } from '../js/state.js';
import { loadNotebook, storeNotebook } from '../js/storage.js';

test('reads and updates the existing Kotoba localStorage format', (t) => {
  const word = { id: 'existing-id', kana: 'いぬ', meaning: 'con chó', kanji: '犬' };
  const key = 'kotoba.notebook.v1';
  const data = new Map([[key, JSON.stringify({ words: [word], known: [word.id], speed: 1.2 })]]);
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (name) => data.get(name), setItem: (name, value) => data.set(name, value) },
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });

  const { saved, available } = loadNotebook();
  const state = createState(saved);
  assert.equal(available, true);
  assert.deepEqual(state.words, [word]);
  assert.equal(state.known.has(word.id), true);
  assert.equal(state.speed, 1.2);
  assert.equal(state.repeats, 1);
  assert.equal(state.wordGap, 500);
  state.speed = 0.8;
  state.repeats = 3;
  state.wordGap = 0;
  state.showKana = false;
  assert.equal(storeNotebook(state), true);
  assert.deepEqual(JSON.parse(data.get(key)), { words: [word], known: [word.id], speed: 0.8, repeats: 3, wordGap: 0, showKana: false, showMeaning: true });
  assert.equal(createState(loadNotebook().saved).repeats, 3);
});

test('adds examples to unchanged starter entries in existing notebooks', () => {
  const sample = { id: 'sample-0', kana: 'さくら', meaning: 'hoa anh đào', kanji: '桜' };
  const changed = { ...sample, kana: 'うめ', meaning: 'hoa mơ', kanji: '梅' };
  assert.match(createState({ words: [sample] }).words[0].example, /桜/);
  assert.equal(createState({ words: [{ ...sample, example: '' }] }).words[0].example, '');
  assert.deepEqual(createState({ words: [changed] }).words, [changed]);
});
