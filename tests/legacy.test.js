import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { upgradeLegacyMeanings } from '../shared/legacy.ts';

const upgrades = JSON.parse(readFileSync(new URL('../frontend/public/data/legacy-n5-vi.json', import.meta.url), 'utf8'));

test('provides Vietnamese upgrades for all 674 former English catalog entries', () => {
  assert.equal(upgrades.length, 674);
  assert.equal(new Set(upgrades.map(({ original }) => original.id)).size, 674);
  const previous = upgrades.map(({ original }) => ({ ...original, meaningLanguage: 'en', example: '自分の例文です。' }));
  const result = upgradeLegacyMeanings(previous, upgrades);
  assert.equal(result.changed, 674);
  assert.deepEqual(result.words.map(({ id }) => id), previous.map(({ id }) => id));
  assert.ok(result.words.every(({ meaningLanguage, example }) => meaningLanguage === 'vi' && example === '自分の例文です。'));
  assert.equal(result.words.find(({ kana }) => kana === 'せっけん').meaning, 'xà phòng');
  assert.equal(result.words.find(({ kana }) => kana === 'はんぶん').meaning, 'một nửa');
  assert.equal(upgradeLegacyMeanings(result.words, upgrades).changed, 0);
});

test('keeps custom translations, custom spellings and unrelated user cards', () => {
  const original = upgrades[0].original;
  const customMeaning = { ...original, meaning: 'nghĩa tôi tự ghi', meaningLanguage: 'en' };
  const customSpelling = { ...original, kana: 'じぶん', meaningLanguage: 'en' };
  const vietnamese = { ...original, meaningLanguage: 'vi' };
  const userCard = { ...original, id: 'user-card', meaningLanguage: 'en' };
  const words = [customMeaning, customSpelling, vietnamese, userCard];
  const result = upgradeLegacyMeanings(words, upgrades);
  assert.equal(result.changed, 0);
  assert.equal(result.words, words);
});
