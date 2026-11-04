import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { kanjiCandidates, newCatalogWords } from '../frontend/js/dictionary.js';
import { makeWord } from '../frontend/js/lib/word.js';

const readData = (name) => JSON.parse(readFileSync(new URL(`../frontend/data/${name}.json`, import.meta.url), 'utf8'));

test('retains distinct homophones and normalizes katakana for lookup', () => {
  const index = readData('kanji');
  assert.deepEqual(kanjiCandidates(index, 'アメ').map(({ kanji }) => kanji).sort(), ['雨', '飴'].sort());
  assert.deepEqual(kanjiCandidates(index, 'constructor'), []);
});

test('validates the entire N5 catalog and skips equivalent notebook spellings', () => {
  const catalog = readData('n5');
  assert.equal(catalog.length, 674);
  assert.equal(new Set(catalog.map(({ id }) => id)).size, 674);
  for (const word of catalog) {
    assert.equal(word.meaningLanguage, 'en');
    assert.doesNotThrow(() => makeWord(word.kana, word.meaning, word.kanji));
  }
  const rain = { id: 'custom', kana: 'アメ', meaning: 'mưa', kanji: '雨' };
  const additions = newCatalogWords(catalog, [rain]);
  assert.ok(!additions.some(({ kanji }) => kanji === '雨'));
  assert.ok(additions.some(({ kanji }) => kanji === '飴'));
});
