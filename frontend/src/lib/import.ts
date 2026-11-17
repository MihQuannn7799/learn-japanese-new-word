import { normalizeSearch } from '../../../shared/kana.ts';
import { makeWord, wordKey } from '../../../shared/word.ts';
import { errorMessage } from './errors.ts';
import type { WordFields } from '../types.ts';

export const importLimit = 250_000;

function detectSeparator(text: string): string {
  let quoted = false;
  let comma = false;
  for (const char of text) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && (char === '|' || char === '\t')) return char;
    else if (!quoted && char === ',') comma = true;
    else if (!quoted && char === '\n') break;
  }
  return comma ? ',' : '|';
}

function splitRows(text: string, separator: string) {
  const rows: { fields: string[]; line: number }[] = [];
  let fields: string[] = [];
  let field = '';
  let quoteState = 'open';
  let line = 1;
  let startLine = line;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoteState === 'quoted') {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') quoteState = 'closed';
      else field += char;
    } else if (char === separator || char === '\n') {
      fields.push(field.trim());
      field = '';
      quoteState = 'open';
      if (char === '\n') {
        if (fields.some(Boolean)) rows.push({ fields, line: startLine });
        fields = [];
        startLine = line + 1;
      }
    } else if (quoteState === 'closed') {
      if (!/\s/u.test(char)) throw new Error(`Dòng ${line}: ký tự sau dấu ngoặc kép.`);
    } else if (char === '"' && !field.trim()) {
      field = '';
      quoteState = 'quoted';
    } else {
      field += char;
    }
    if (char === '\n') line++;
  }
  if (quoteState === 'quoted') throw new Error(`Dòng ${startLine}: thiếu dấu ngoặc kép đóng.`);
  fields.push(field.trim());
  if (fields.some(Boolean)) rows.push({ fields, line: startLine });
  return rows;
}

export function parseImport(rawText: string): WordFields[] {
  if (rawText.length > importLimit) throw new Error('Danh sách tối đa 250.000 ký tự.');
  const text = rawText.replace(/^\uFEFF/u, '').replace(/\r\n?/g, '\n');
  if (!text.trim()) throw new Error('Dán danh sách hoặc chọn một tệp để nhập.');
  const rows = splitRows(text, detectSeparator(text.trimStart()));
  if (['kana', 'hiragana', 'katakana', 'tutiengnhat'].includes(normalizeSearch(rows[0]?.fields[0] ?? ''))) rows.shift();
  const words: WordFields[] = [];
  const errors: string[] = [];
  for (const { fields, line } of rows) {
    try {
      if (fields.length < 2 || fields.length > 3) throw new Error('Cần 2 hoặc 3 cột theo thứ tự kana, nghĩa, kanji.');
      words.push(makeWord(fields[0], fields[1], fields[2]));
    } catch (error) {
      errors.push(`Dòng ${line}: ${errorMessage(error)}`);
    }
  }
  if (errors.length) {
    const remaining = errors.length > 5 ? `\nCòn ${errors.length - 5} dòng cần sửa.` : '';
    throw new Error(errors.slice(0, 5).join('\n') + remaining);
  }
  if (!words.length) throw new Error('Danh sách chưa có từ nào.');
  return words;
}

// Deduplicate against the notebook and earlier rows while keeping the input order.
export function uniqueImports<T extends WordFields>(imported: T[], existing: WordFields[]): T[] {
  const keys = new Set(existing.map(wordKey));
  return imported.filter((word) => {
    const key = wordKey(word);
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
}
