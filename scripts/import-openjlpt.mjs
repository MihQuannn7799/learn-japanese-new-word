import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeWord } from '../frontend/js/lib/word.js';
import { normalizeKana } from '../frontend/js/lib/kana.js';

const source = process.argv[2];
if (!source) throw new Error('Dùng: node scripts/import-openjlpt.mjs <thư mục data/json/vocab của OpenJLPT>');
const levels = [5, 4, 3, 2, 1];
const catalog = [];
const lookup = new Map();

for (const level of levels) {
  const entries = JSON.parse(readFileSync(join(source, `n${level}.json`), 'utf8'));
  for (const entry of entries) {
    const kanji = /\p{Script=Han}/u.test(entry.word) ? entry.word : '';
    const meaning = entry.meanings.join('; ');
    const gloss = meaning.length <= 240 ? meaning : entry.meanings[0].slice(0, 240);
    let word;
    try {
      word = makeWord(entry.reading, gloss, kanji);
    } catch (error) {
      if (level === 5) throw new Error(`N5 ${entry.word} / ${entry.reading}: ${error.message}`);
      continue;
    }
    if (level === 5) catalog.push({ id: `n5-${entry.id}`, ...word, meaningLanguage: 'en' });
    if (!kanji) continue;
    const key = normalizeKana(word.kana);
    const candidates = lookup.get(key) ?? new Map();
    if (!candidates.has(kanji)) candidates.set(kanji, { kanji, meaning: word.meaning, level: `N${level}` });
    lookup.set(key, candidates);
  }
}

writeFileSync(new URL('../frontend/data/n5.json', import.meta.url), `[\n${catalog.map((row) => JSON.stringify(row)).join(',\n')}\n]\n`);
const rows = [...lookup].sort(([first], [second]) => first.localeCompare(second, 'ja'));
writeFileSync(new URL('../frontend/data/kanji.json', import.meta.url),
  `{\n${rows.map(([key, values]) => `${JSON.stringify(key)}:${JSON.stringify([...values.values()])}`).join(',\n')}\n}\n`);
console.log(`N5: ${catalog.length} từ · Tra cứu: ${rows.length} cách đọc`);
