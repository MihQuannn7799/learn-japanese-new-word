export function normalizeKana(text) {
  return text.normalize('NFKC').trim().replace(/[ァ-ヶヽヾ]/g, (character) =>
    String.fromCodePoint(character.codePointAt(0) - 0x60)
  ).replace(/\s+/gu, '');
}

export function normalizeSearch(text) {
  return normalizeKana(text).normalize('NFD').toLocaleLowerCase('vi')
    .replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd').normalize('NFC');
}

export function answerMatches(answer, word) {
  const normalized = normalizeKana(answer);
  return normalized !== '' && (normalized === normalizeKana(word.kana) ||
    (word.kanji !== '' && normalized === normalizeKana(word.kanji)));
}
