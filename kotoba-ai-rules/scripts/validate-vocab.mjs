#!/usr/bin/env node
// Kiểm tra một danh sách từ vựng trước khi nhập vào app.
// Chạy: node scripts/validate-vocab.mjs duong-dan/danh-sach.txt
//
// Dùng đúng parseImport của app, nên kết quả khớp với việc nhập thật.
// Báo: lỗi định dạng, từ trùng trong file, từ trùng với starterWords.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = ['dist', 'src', '.'].map((name) => join(repoRoot, name))
  .find((dir) => existsSync(join(dir, 'words.js')));

const file = process.argv[2];
if (!file) {
  console.error('Cách dùng: node scripts/validate-vocab.mjs <tệp .txt/.csv/.tsv>');
  process.exit(2);
}
if (!sourceRoot) {
  console.error('Không tìm thấy words.js.');
  process.exit(2);
}

const { parseImport, starterWords, wordKey } = await import(pathToFileURL(join(sourceRoot, 'words.js')).href);

let words;
try {
  words = parseImport(readFileSync(file, 'utf8'));
} catch (error) {
  console.error(`✗ Không nhập được:\n${error.message}`);
  process.exit(1);
}

const seen = new Map();
const duplicatesInFile = [];
for (const word of words) {
  const key = wordKey(word);
  if (seen.has(key)) duplicatesInFile.push(word);
  else seen.set(key, word);
}

const starterKeys = new Set(starterWords.map(wordKey));
const overlapStarter = words.filter((word) => starterKeys.has(wordKey(word)));

console.log(`✓ ${words.length} từ hợp lệ.`);
if (duplicatesInFile.length) {
  console.log(`⚠ ${duplicatesInFile.length} từ trùng trong file (app sẽ bỏ qua khi nhập):`);
  for (const word of duplicatesInFile.slice(0, 10)) console.log(`   ${word.kana} | ${word.meaning} | ${word.kanji}`);
}
if (overlapStarter.length) console.log(`⚠ ${overlapStarter.length} từ trùng với từ mẫu của app.`);
