import { makeWord } from '../shared/word.ts';
import { wordGaps } from '../shared/settings.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { NotebookDatabase } from './database.ts';
import type { Notebook } from '../shared/notebook.ts';

const maxBody = 8 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validNotebook(value: unknown): value is Notebook {
  if (!isRecord(value)) return false;
  if (!value || !Array.isArray(value.words) || value.words.length > 20000 || !Array.isArray(value.known)) return false;
  const { words, known, speed, repeats, wordGap, showKana, showMeaning } = value;
  if (typeof speed !== 'number' || !Number.isFinite(speed) || speed < 0.5 || speed > 1.5 ||
      typeof repeats !== 'number' || !Number.isInteger(repeats) || repeats < 1 || repeats > 5 ||
      typeof wordGap !== 'number' || !wordGaps.includes(wordGap) ||
      typeof showKana !== 'boolean' || typeof showMeaning !== 'boolean') return false;
  const ids = new Set<string>();
  try {
    for (const word of words as unknown[]) {
      if (!isRecord(word) || typeof word.id !== 'string' || !/^[\w-]{1,100}$/.test(word.id) || ids.has(word.id) ||
          typeof word.kana !== 'string' || typeof word.meaning !== 'string' || typeof word.kanji !== 'string') return false;
      makeWord(word.kana, word.meaning, word.kanji);
      for (const key of ['example', 'exampleMeaning', 'display', 'displayKana', 'hanViet']) {
        const text = word[key];
        if (text !== undefined && (typeof text !== 'string' || text.length > 240)) return false;
      }
      if (word.lesson !== undefined && (typeof word.lesson !== 'number' || !Number.isInteger(word.lesson) || word.lesson < 1 || word.lesson > 50)) return false;
      for (const key of ['alternateKana', 'alternateKanji']) {
        const variants = word[key];
        if (variants !== undefined && (!Array.isArray(variants) || variants.length > 16 || variants.some((text: unknown) => typeof text !== 'string' || text.length > 120))) return false;
      }
      if (word.meaningLanguage !== undefined && word.meaningLanguage !== 'vi' && word.meaningLanguage !== 'en') return false;
      ids.add(word.id);
    }
  } catch {
    return false;
  }
  return known.length <= words.length && known.every((id: unknown) => typeof id === 'string' && ids.has(id));
}

export function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(value));
}

export async function notebookApi(request: IncomingMessage, response: ServerResponse, database: NotebookDatabase, origin: string): Promise<void> {
  if (request.method === 'GET') return json(response, 200, database.read());
  if (request.method !== 'PUT') return json(response, 405, { error: 'Phương thức không hỗ trợ.' });
  if (request.headers.origin && request.headers.origin !== origin) return json(response, 403, { error: 'Yêu cầu khác nguồn.' });
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') return json(response, 415, { error: 'Cần gửi JSON.' });
  if (Number(request.headers['content-length']) > maxBody) return json(response, 413, { error: 'Sổ tay vượt quá 8 MB.' });

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBody) {
      json(response, 413, { error: 'Sổ tay vượt quá 8 MB.' });
      return;
    }
    chunks.push(chunk);
  }
  let payload: unknown;
  try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { return json(response, 400, { error: 'JSON không hợp lệ.' }); }
  const { revision, notebook } = isRecord(payload) ? payload : {};
  if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0 || !validNotebook(notebook)) {
    return json(response, 422, { error: 'Dữ liệu sổ tay không hợp lệ.' });
  }
  if (!database.write(revision, notebook)) return json(response, 409, database.read());
  return json(response, 200, { revision: revision + 1 });
}
