export const starterWords = [
  ['さくら', 'hoa anh đào', '桜'],
  ['ねこ', 'con mèo', '猫'],
  ['みず', 'nước', '水'],
  ['ともだち', 'bạn bè', '友達'],
  ['やま', 'núi', '山'],
  ['コーヒー', 'cà phê', ''],
  ['たべる', 'ăn', '食べる'],
  ['あした', 'ngày mai', '明日'],
].map(([kana, meaning, kanji], index) => ({ id: `sample-${index}`, kana, meaning, kanji }));

export const importLimit = 250_000;

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

export function wordKey({ kana, meaning, kanji }) {
  return JSON.stringify([
    normalizeKana(kana), meaning.normalize('NFC').toLocaleLowerCase('vi'), normalizeKana(kanji),
  ]);
}

export function makeWord(kana, meaning, kanji = '') {
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

function detectSeparator(text) {
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

function splitRows(text, separator) {
  const rows = [];
  let fields = [];
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

export function parseImport(rawText) {
  if (rawText.length > importLimit) throw new Error('Danh sách tối đa 250.000 ký tự.');
  const text = rawText.replace(/^\uFEFF/u, '').replace(/\r\n?/g, '\n');
  if (!text.trim()) throw new Error('Dán danh sách hoặc chọn một tệp để nhập.');
  const rows = splitRows(text, detectSeparator(text.trimStart()));
  if (['kana', 'hiragana', 'katakana', 'tutiengnhat'].includes(normalizeSearch(rows[0]?.fields[0] ?? ''))) rows.shift();
  const words = [];
  const errors = [];
  for (const { fields, line } of rows) {
    try {
      if (fields.length < 2 || fields.length > 3) throw new Error('Cần 2 hoặc 3 cột theo thứ tự kana, nghĩa, kanji.');
      words.push(makeWord(...fields));
    } catch (error) {
      errors.push(`Dòng ${line}: ${error.message}`);
    }
  }
  if (errors.length) {
    const remaining = errors.length > 5 ? `\nCòn ${errors.length - 5} dòng cần sửa.` : '';
    throw new Error(errors.slice(0, 5).join('\n') + remaining);
  }
  if (!words.length) throw new Error('Danh sách chưa có từ nào.');
  return words;
}
