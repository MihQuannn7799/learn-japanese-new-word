#!/usr/bin/env node
// Kiểm tra một danh sách từ vựng trước khi nhập vào app.
// Chạy: node scripts/validate-vocab.mjs duong-dan/danh-sach.txt
//
// Dùng đúng parseImport của app, nên kết quả khớp với việc nhập thật.
// Báo: lỗi định dạng, từ trùng trong file, từ trùng với starterWords.

import { readFileSync } from 'node:fs';
import { parseImport } from '../frontend/js/lib/import.js';
import { starterWords } from '../frontend/js/data/starter-words.js';
import { wordKey } from '../frontend/js/lib/word.js';

const file = process.argv[2];
if (!file) {
  console.error('Cách dùng: node scripts/validate-vocab.mjs <tệp .txt/.csv/.tsv>');
  process.exit(2);
}
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
