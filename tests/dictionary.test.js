import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { kanjiCandidates, newCatalogWords, wordsInLesson } from '../frontend/src/dictionary.ts';
import { makeWord } from '../shared/word.ts';

const readData = (name) => JSON.parse(readFileSync(new URL(`../frontend/public/data/${name}.json`, import.meta.url), 'utf8'));

test('retains distinct homophones and normalizes katakana for lookup', () => {
  const index = readData('kanji-vi');
  assert.deepEqual(kanjiCandidates(index, 'アツイ').map(({ kanji }) => kanji).sort(), ['暑い', '熱い'].sort());
  assert.deepEqual(kanjiCandidates(index, 'constructor'), []);
});

test('retains every source entry across 50 ordered Minna lessons', () => {
  const catalog = readData('minna-vi');
  const lessons = readData('minna-lessons');
  const source = readData('minna-source');
  assert.deepEqual(lessons.map(({ number }) => number), Array.from({ length: 50 }, (_, index) => index + 1));
  assert.equal(source.catalogCount, 1929);
  assert.equal(source.catalogCount, catalog.length);
  assert.deepEqual(lessons.map(({ wordIds }) => wordIds.length), source.lessons.map(({ count }) => count));
  assert.ok(lessons.every(({ title, wordIds }) => title.trim() && wordIds.length));
  assert.deepEqual(lessons.flatMap(({ wordIds }) => wordIds).sort(), catalog.map(({ id }) => id).sort());
});

test('adds only the selected lesson, skipping equivalent notebook entries', () => {
  const catalog = readData('minna-vi');
  const lesson = readData('minna-lessons')[1];
  const scope = wordsInLesson(catalog, lesson);
  const book = { id: 'custom', kana: 'ホン', meaning: 'sách', kanji: '本' };
  const additions = newCatalogWords(scope, [book]);
  assert.equal(wordsInLesson(catalog), catalog);
  assert.ok(scope.some(({ kanji }) => kanji === '本'));
  assert.ok(!additions.some(({ kanji }) => kanji === '本'));
  assert.ok(additions.every(({ lesson }) => lesson === 2));
  assert.equal(additions.length, scope.length - 1);
});

test('validates the entire Vietnamese catalog and its reading variants', () => {
  const catalog = readData('minna-vi');
  assert.equal(catalog.length, 1929);
  assert.equal(new Set(catalog.map(({ id }) => id)).size, catalog.length);
  for (const word of catalog) {
    assert.equal(word.meaningLanguage, 'vi');
    assert.doesNotThrow(() => makeWord(word.kana, word.meaning, word.kanji));
    for (const kana of word.alternateKana ?? []) assert.doesNotThrow(() => makeWord(kana, word.meaning));
    assert.ok(word.example && word.exampleMeaning, word.id);
  }
  const book = { id: 'custom', kana: 'ホン', meaning: 'sách', kanji: '本' };
  const additions = newCatalogWords(catalog, [book]);
  assert.ok(!additions.some(({ kanji }) => kanji === '本'));
  assert.ok(additions.some(({ kanji }) => kanji === '辞書'));
});

test('lesson 2 includes stationery and conversational expressions with corrected spellings', () => {
  const scope = wordsInLesson(readData('minna-vi'), readData('minna-lessons')[1]);
  assert.equal(scope.length, 47);
  assert.ok(scope.some(({ kanji, meaning }) => kanji === '名刺' && meaning.includes('danh')));
  assert.ok(!scope.some(({ kanji }) => kanji === '名詞'));
  assert.ok(scope.some(({ kana }) => kana === 'ありがとう'));
  assert.ok(scope.some(({ kana }) => kana === 'テープ'));
  assert.ok(scope.some(({ kana }) => kana === 'チョコレート'));
});
