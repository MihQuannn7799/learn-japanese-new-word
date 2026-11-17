import assert from 'node:assert/strict';
import test from 'node:test';
import { createState, currentWord, flashProgress, startFlashSession } from '../frontend/src/state.ts';
import { flashView } from '../frontend/src/views/flashcard.ts';

const words = ['a', 'b', 'c'].map((id) => ({ id, kana: 'れい', kanji: '例', meaning: 'ví dụ' }));

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

test('flipped cards retain the Vietnamese deck’s display kana and example audio', () => {
  const word = {
    ...words[0],
    displayKana: 'れい（例）',
    meaning: '<ví dụ>',
    example: '例を見ます。',
    exampleMeaning: 'Tôi xem ví dụ.',
  };
  const state = createState({ words: [word] });
  state.flipped = true;

  const html = flashView(state, currentWord(state));
  assert.match(html, /れい（例）/);
  assert.match(html, /&lt;ví dụ&gt;/);
  assert.match(html, /例を見ます。/);
  assert.ok(html.includes('Tôi xem ví dụ.'));
  assert.match(html, /data-action="speak-example"/);
});
