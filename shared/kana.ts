import { toHiragana } from 'wanakana';
import type { WordFields } from './notebook.ts';

export function normalizeKana(text: string): string {
  const normalized = text.normalize('NFKC').trim().replace(/\s+/gu, '');
  // Preserve long vowels and Latin text used in Vietnamese/English searches.
  return toHiragana(normalized, { passRomaji: true, convertLongVowelMark: false })
    .replaceAll('ヽ', 'ゝ').replaceAll('ヾ', 'ゞ');
}

export function normalizeSearch(text: string): string {
  return normalizeKana(text).normalize('NFD').toLocaleLowerCase('vi')
    .replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd').normalize('NFC');
}

export function answerMatches(answer: string, word: Pick<WordFields, 'kana' | 'kanji' | 'alternateKana' | 'alternateKanji'>): boolean {
  const normalized = normalizeKana(answer);
  const accepted = [word.kana, word.kanji, ...(word.alternateKana ?? []), ...(word.alternateKanji ?? [])];
  return normalized !== '' && accepted.some((value) => value !== '' && normalized === normalizeKana(value));
}
