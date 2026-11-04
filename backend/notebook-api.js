import { makeWord } from '../frontend/js/lib/word.js';
import { wordGaps } from '../frontend/js/state.js';

const maxBody = 8 * 1024 * 1024;

function validNotebook(value) {
  if (!value || !Array.isArray(value.words) || value.words.length > 20000 || !Array.isArray(value.known)) return false;
  const { words, known, speed, repeats, wordGap, showKana, showMeaning } = value;
  if (!Number.isFinite(speed) || speed < 0.5 || speed > 1.5 ||
      !Number.isInteger(repeats) || repeats < 1 || repeats > 5 || !wordGaps.includes(wordGap) ||
      typeof showKana !== 'boolean' || typeof showMeaning !== 'boolean') return false;
  const ids = new Set();
  try {
    for (const word of words) {
      if (!word || !/^[\w-]{1,100}$/.test(word.id) || typeof word.id !== 'string' || ids.has(word.id) ||
          typeof word.kana !== 'string' || typeof word.meaning !== 'string' || typeof word.kanji !== 'string') return false;
      makeWord(word.kana, word.meaning, word.kanji);
      for (const key of ['example', 'exampleMeaning']) {
        if (word[key] !== undefined && (typeof word[key] !== 'string' || word[key].length > 240)) return false;
      }
      if (word.meaningLanguage !== undefined && !['vi', 'en'].includes(word.meaningLanguage)) return false;
      ids.add(word.id);
    }
  } catch {
    return false;
  }
  return known.length <= words.length && known.every((id) => ids.has(id));
}

export function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(value));
}

export async function notebookApi(request, response, database, origin) {
  if (request.method === 'GET') return json(response, 200, database.read());
  if (request.method !== 'PUT') return json(response, 405, { error: 'Phương thức không hỗ trợ.' });
  if (request.headers.origin && request.headers.origin !== origin) return json(response, 403, { error: 'Yêu cầu khác nguồn.' });
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') return json(response, 415, { error: 'Cần gửi JSON.' });
  if (Number(request.headers['content-length']) > maxBody) return json(response, 413, { error: 'Sổ tay vượt quá 8 MB.' });

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBody) {
      json(response, 413, { error: 'Sổ tay vượt quá 8 MB.' });
      return;
    }
    chunks.push(chunk);
  }
  let payload;
  try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { return json(response, 400, { error: 'JSON không hợp lệ.' }); }
  const { revision, notebook } = payload ?? {};
  if (!Number.isSafeInteger(revision) || revision < 0 || !validNotebook(notebook)) {
    return json(response, 422, { error: 'Dữ liệu sổ tay không hợp lệ.' });
  }
  if (!database.write(revision, notebook)) return json(response, 409, database.read());
  return json(response, 200, { revision: revision + 1 });
}
