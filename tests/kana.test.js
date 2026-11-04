import assert from 'node:assert/strict';
import test from 'node:test';
import { answerMatches, normalizeKana, normalizeSearch } from '../js/lib/kana.js';

test('normalizeKana folds width, kana script and whitespace', () => {
  assert.equal(normalizeKana('  ｶﾞ ｸ セ イ '), 'がくせい');
  assert.equal(normalizeKana('コーヒー'), 'こーひー');
  assert.equal(normalizeKana('カヽヾ'), 'かゝゞ');
});

test('answerMatches accepts equivalent kana and the stored kanji', () => {
  const word = { kana: 'がくせい', kanji: '学生' };
  assert.equal(answerMatches('ガクセイ', word), true);
  assert.equal(answerMatches(' 学生 ', word), true);
  assert.equal(answerMatches('かくせい', word), false);
});

test('answerMatches rejects empty input for words without kanji', () => {
  assert.equal(answerMatches('　', { kana: 'パン', kanji: '' }), false);
});

test('normalizeSearch supports Vietnamese text without diacritics', () => {
  assert.equal(normalizeSearch('ĐỒ ĂN'), 'doan');
});
