import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeWord } from '../shared/word.ts';
import { normalizeKana } from '../shared/kana.ts';

const repository = 'NhatPrv/Guga-Gangs';
const revision = '75d02e0ca61c63796e4e5723f35d2eb5aa8871f8';
const root = new URL('../frontend/public/data/', import.meta.url);
const args = process.argv.slice(2);
const cache = resolve(args.find((arg) => !arg.startsWith('--')) ?? '.cache/minna');
const download = args.includes('--download');
const hash = (text) => createHash('sha256').update(text).digest('hex');

async function source(path) {
  const cached = join(cache, path);
  if (download) {
    const response = await fetch(`https://raw.githubusercontent.com/${repository}/${revision}/${path}`, { signal: AbortSignal.timeout(25000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
    await mkdir(resolve(cached, '..'), { recursive: true });
    await writeFile(cached, await response.text());
  }
  return readFile(cached, 'utf8');
}

function exampleParts(text = '') {
  const trimmed = text.trim();
  if (!trimmed.endsWith(')')) return { example: trimmed };
  let depth = 0;
  for (let index = trimmed.length - 1; index >= 0; index--) {
    if (trimmed[index] === ')') depth++;
    if (trimmed[index] === '(') depth--;
    if (depth === 0) return { example: trimmed.slice(0, index).trim(), exampleMeaning: trimmed.slice(index + 1, -1).trim() };
  }
  return { example: trimmed };
}

function forms(text) {
  const variants = [];
  for (const part of text.replace(/[ⅠⅡⅢ]/g, '').normalize('NFKC').replace(/\s+[IVX]+$/u, '').split(/[／/]/u)) {
    let queue = [part];
    while (queue.some((value) => /\[[^\]]*\]|「[^」]*」|\([^)]*\)/u.test(value))) {
      queue = queue.flatMap((value) => {
        const match = /\[([^\]]*)\]|「([^」]*)」|\(([^)]*)\)/u.exec(value);
        if (!match) return [value];
        const before = value.slice(0, match.index);
        const after = value.slice(match.index + match[0].length);
        return [before + after, before + (match[1] ?? match[2] ?? match[3]) + after];
      });
      if (queue.length > 16) throw new Error('Quá nhiều biến thể trong một mục.');
    }
    variants.push(...queue.map((value) => value.replace(/[~〜～∼―－\-\[\]「」『』()（）［］。、,?!？！….]/gu, '').trim()));
  }
  return [...new Set(variants.filter(Boolean))];
}

const catalog = [];
const lessons = [];
const manifest = [];
const lookup = new Map();
const errors = [];
const corrections = JSON.parse(await readFile(new URL('./data/minna-corrections.json', import.meta.url), 'utf8'));
async function readLesson(number) {
  const level = number <= 25 ? 'n5' : 'n4';
  const directory = `data/minna-no-nihongo-${level}/unit-${String(number).padStart(2, '0')}`;
  const raw = await source(`${directory}/vocabulary.json`);
  const metadata = JSON.parse(await source(`${directory}/_meta.json`));
  return { number, level, directory, raw, metadata };
}
const sourceLessons = [];
for (let first = 1; first <= 50; first += 5) {
  sourceLessons.push(...await Promise.all(Array.from({ length: 5 }, (_, index) => readLesson(first + index))));
}

for (const { number, level, directory, raw, metadata } of sourceLessons) {
  const entries = JSON.parse(raw);
  if (!Array.isArray(entries) || !entries.length) throw new Error(`Bài ${number} không có dữ liệu.`);
  const wordIds = [];
  const occurrences = new Map();
  for (const [index, original] of entries.entries()) {
    const entry = { ...original, ...corrections[`${number}:${index + 1}`] };
    try {
      const displayKana = entry.reading.trim();
      const readings = forms(displayKana);
      const writtenForms = forms(entry.word);
      const kana = readings[0];
      const kanji = /\p{Script=Han}/u.test(entry.word) ? writtenForms[0] : '';
      const fields = makeWord(kana, entry.meaning, kanji);
      for (const reading of readings) makeWord(reading, entry.meaning);
      const key = JSON.stringify([normalizeKana(kana), kanji]);
      const occurrence = (occurrences.get(key) ?? 0) + 1;
      occurrences.set(key, occurrence);
      const id = `minna-${String(number).padStart(2, '0')}-${hash(key).slice(0, 10)}${occurrence > 1 ? `-${occurrence}` : ''}`;
      const examples = exampleParts(entry.example);
      if (Object.values(examples).some((text) => text.length > 240)) throw new Error('Câu ví dụ vượt quá 240 ký tự.');
      const word = { id, ...fields, meaningLanguage: 'vi', lesson: number, ...examples };
      if (entry.word.trim() !== (kanji || kana)) word.display = entry.word.trim();
      if (displayKana !== kana) word.displayKana = displayKana;
      if (readings.length > 1) word.alternateKana = readings.slice(1);
      if (kanji && writtenForms.length > 1) word.alternateKanji = writtenForms.slice(1);
      if (entry.sinoVietnamese?.trim()) word.hanViet = entry.sinoVietnamese.trim();
      catalog.push(word);
      wordIds.push(id);
      if (kanji) {
        const length = Math.max(writtenForms.length, readings.length);
        for (let variant = 0; variant < length; variant++) {
          const written = writtenForms.length === 1 ? writtenForms[0] : writtenForms[variant];
          const kanaForm = readings.length === 1 ? readings[0] : readings[variant];
          if (!written || !kanaForm) continue;
          const reading = normalizeKana(kanaForm);
          const candidates = lookup.get(reading) ?? [];
          if (!candidates.some((candidate) => candidate.kanji === written && candidate.meaning === word.meaning)) {
            candidates.push({ kanji: written, meaning: word.meaning, level: level.toUpperCase() });
          }
          lookup.set(reading, candidates);
        }
      }
    } catch (error) {
      errors.push(`Bài ${number}, mục ${index + 1}, ${entry.word}: ${error.message}`);
    }
  }
  const title = metadata.title ?? metadata.name ?? `Bài ${number}`;
  lessons.push({ number, title, wordIds });
  manifest.push({ number, count: entries.length, sha256: hash(raw), path: `${directory}/vocabulary.json` });
}

if (errors.length) throw new Error(`${errors.length} mục cần kiểm tra:\n${errors.join('\n')}`);
if (new Set(catalog.map(({ id }) => id)).size !== catalog.length) throw new Error('ID từ bị trùng.');
const license = await source('LICENSE');
const legacyOverrides = JSON.parse(await readFile(new URL('./data/legacy-n5-vi.json', import.meta.url), 'utf8'));
let legacy;
try { legacy = JSON.parse(await readFile(new URL('n5.json', root), 'utf8')); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  legacy = JSON.parse(await readFile(new URL('legacy-n5-vi.json', root), 'utf8')).map(({ original }) => original);
}
const translations = new Map();
for (const word of catalog) {
  const key = `${normalizeKana(word.kana)}|${word.kanji.normalize('NFKC')}`;
  if (!translations.has(key)) translations.set(key, word.meaning);
}
const upgrades = legacy.map(({ id, kana, kanji, meaning }) => {
  const vietnamese = legacyOverrides[`${kana}|${kanji}`] ?? translations.get(`${normalizeKana(kana)}|${kanji.normalize('NFKC')}`);
  if (!vietnamese) throw new Error(`Chưa có nghĩa tiếng Việt cho thẻ cũ: ${kana} / ${kanji}`);
  return { original: { id, kana, kanji, meaning }, meaning: vietnamese };
});
const outputs = {
  'minna-vi.json': catalog,
  'minna-lessons.json': lessons,
  'kanji-vi.json': Object.fromEntries(lookup),
  'minna-source.json': { repository, revision, catalogCount: catalog.length, corrections: Object.keys(corrections), lessons: manifest },
  'legacy-n5-vi.json': upgrades,
};
await mkdir(root, { recursive: true });
for (const [name, value] of Object.entries(outputs)) {
  await writeFile(new URL(name, root), JSON.stringify(value, null, 2) + '\n');
}
await writeFile(new URL('LICENSE-MINNA-MIT.txt', root), license);
console.log(`Đã nhập ${catalog.length} mục Nhật–Việt trong đủ 50 bài vào ${fileURLToPath(root)}.`);
