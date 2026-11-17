import { normalizeKana } from './kana.ts';
import type { WordFields } from './notebook.ts';

export function wordKey({ kana, meaning, kanji }: WordFields): string {
  return JSON.stringify([
    normalizeKana(kana), meaning.normalize('NFC').toLocaleLowerCase('vi'), normalizeKana(kanji),
  ]);
}

export function makeWord(kana: string, meaning: string, kanji = ''): WordFields {
  const word = { kana: kana.trim().normalize('NFKC'), meaning: meaning.trim(), kanji: kanji.trim() };
  const kanaLetters = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;
  if (!kanaLetters.test(word.kana) || !/^[\p{Script=Hiragana}\p{Script=Katakana}\sー・･゙゚]+$/u.test(word.kana)) {
    throw new Error('Nhập cách đọc bằng hiragana hoặc katakana.');
  }
  if (!word.meaning) throw new Error('Nhập nghĩa tiếng Việt.');
  if (word.kana.length > 120 || word.kanji.length > 120 || word.meaning.length > 240) {
    throw new Error('Kana và kanji tối đa 120 ký tự, nghĩa tối đa 240 ký tự.');
  }
  return word;
}
