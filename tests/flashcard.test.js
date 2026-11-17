import assert from 'node:assert/strict';
import test from 'node:test';
import { createState, currentWord, flashProgress, startFlashSession } from '../frontend/js/state.js';

const words = ['a', 'b', 'c'].map((id) => ({ id }));

test('counts remembered words in the selected deck until a new session starts', () => {
  const state = createState({ words, known: ['a'] });
  startFlashSession(state, 'unknown');
  assert.deepEqual(state.flashOrder, ['b', 'c']);
  assert.deepEqual(flashProgress(state), { remembered: 0, total: 2, percent: 0 });

  state.known.add('b');
  state.flashIndex++;
  assert.equal(currentWord(state).id, 'c');
  assert.deepEqual(flashProgress(state), { remembered: 1, total: 2, percent: 50 });

  startFlashSession(state);
  assert.deepEqual(state.flashOrder, ['c']);
  assert.equal(state.flashIndex, 0);
});

test('the known filter excludes newly forgotten words on restart and can become empty', () => {
  const state = createState({ words, known: ['a'] });
  startFlashSession(state, 'known');
  state.known.delete('a');
  assert.deepEqual(flashProgress(state), { remembered: 0, total: 1, percent: 0 });

  startFlashSession(state);
  assert.equal(currentWord(state), undefined);
  assert.deepEqual(flashProgress(state), { remembered: 0, total: 0, percent: 0 });
});

test('random practice contains each word once regardless of whether it is known', () => {
  const state = createState({ words, known: ['a'] });
  assert.equal(state.flashFilter, 'random');
  assert.deepEqual([...state.flashOrder].sort(), ['a', 'b', 'c']);
  assert.deepEqual(flashProgress(state), { remembered: 1, total: 3, percent: 33 });
});
