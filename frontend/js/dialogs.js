import { findKanji } from './dictionary.js';
import { importLimit, parseImport, uniqueImports } from './lib/import.js';
import { makeWord, wordKey } from './lib/word.js';
import { escapeHtml } from './views/shared.js';
import { wordById } from './state.js';

const $ = (selector) => document.querySelector(selector);
const uniqueId = () => globalThis.crypto?.randomUUID?.() ?? `word-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function initDialogs({ state, notify, onChange }) {
  const entryDialog = $('#entry-dialog');
  const importDialog = $('#import-dialog');
  const deleteDialog = $('#delete-dialog');
  const deleteAllDialog = $('#delete-all-dialog');
  const entryForm = $('#entry-form');
  const importForm = $('#import-form');

  let editingId = '';
  let deletingId = '';
  let importFileVersion = 0;
  let lookupVersion = 0;
  const kanaInput = entryForm.elements.namedItem('kana');
  const kanjiInput = entryForm.elements.namedItem('kanji');
  const kanjiStatus = $('#kanji-status');
  const candidates = $('#kanji-candidates');

  async function lookupKanji() {
    const version = ++lookupVersion;
    const kana = kanaInput.value.trim();
    candidates.replaceChildren();
    kanjiStatus.textContent = kana ? 'Đang tra kanji…' : 'Nhập kana để tra cách viết.';
    if (!kana) return;
    try {
      const choices = await findKanji(kana);
      if (version !== lookupVersion || !entryDialog.open) return;
      kanjiStatus.textContent = choices.length
        ? 'Chọn cách viết khớp với nghĩa bạn muốn.'
        : 'Chưa thấy kanji phù hợp trong kho. Bạn có thể nhập tay hoặc để trống.';
      candidates.innerHTML = choices.map(({ kanji, meaning, level }) =>
        `<button type="button" class="btn secondary kanji-choice" data-kanji="${escapeHtml(kanji)}"><strong lang="ja">${escapeHtml(kanji)}</strong><span lang="en">${escapeHtml(meaning)}</span><span class="badge">${escapeHtml(level)}</span></button>`
      ).join('');
    } catch {
      if (version === lookupVersion && entryDialog.open) kanjiStatus.textContent = 'Không tải được gợi ý kanji. Bạn vẫn có thể nhập tay.';
    }
  }

  kanaInput.addEventListener('input', (event) => {
    if (!event.isComposing) void lookupKanji();
  });
  kanaInput.addEventListener('compositionend', lookupKanji);
  candidates.addEventListener('click', (event) => {
    const choice = event.target.closest('button[data-kanji]');
    if (!choice) return;
    kanjiInput.value = choice.dataset.kanji;
    kanjiInput.focus();
  });
  entryDialog.addEventListener('close', () => { lookupVersion++; });

  function openEntry(word, initial = word) {
    editingId = word?.id ?? '';
    entryForm.reset();
    $('#entry-title').textContent = word ? 'Sửa từ vựng' : 'Thêm từ mới';
    $('#entry-error').textContent = '';
    for (const name of ['kana', 'meaning', 'kanji', 'example', 'exampleMeaning']) entryForm.elements.namedItem(name).value = initial?.[name] ?? '';
    entryForm.elements.namedItem('meaningLanguage').value = initial?.meaningLanguage === 'en' ? 'en' : 'vi';
    entryDialog.showModal();
    void lookupKanji();
  }

  function openImport() {
    importForm.reset();
    $('#import-error').textContent = '';
    importDialog.showModal();
  }

  function openDelete(word) {
    deletingId = word.id;
    $('#delete-word').textContent = `${word.kanji || word.kana} · ${word.meaning}`;
    deleteDialog.showModal();
  }

  function openDeleteAll() {
    if (!state.words.length) return;
    $('#delete-all-description').textContent = `Bạn sẽ xóa toàn bộ ${state.words.length} thẻ trong sổ tay, kể cả các thẻ không hiện do tìm kiếm, cùng tiến độ học của chúng. Không thể hoàn tác thao tác này.`;
    deleteAllDialog.showModal();
  }

  entryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = new FormData(entryForm);
    try {
      const word = makeWord(fields.get('kana'), fields.get('meaning'), fields.get('kanji'));
      if (fields.get('meaningLanguage') === 'en') word.meaningLanguage = 'en';
      const example = fields.get('example').trim();
      const exampleMeaning = fields.get('exampleMeaning').trim();
      if (exampleMeaning && !example) throw new Error('Nhập câu tiếng Nhật trước khi thêm bản dịch.');
      if (example && !/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(example)) {
        throw new Error('Câu ví dụ cần có chữ tiếng Nhật.');
      }
      word.example = example;
      if (exampleMeaning) word.exampleMeaning = exampleMeaning;
      if (state.words.some((item) => item.id !== editingId && wordKey(item) === wordKey(word))) {
        throw new Error('Từ này đã có trong sổ tay.');
      }
      const id = editingId || uniqueId();
      if (editingId) {
        const previous = wordById(state, editingId);
        if (wordKey(previous) !== wordKey(word)) {
          state.known.delete(id);
          state.correctAnswers.delete(id);
          state.dictationDrafts.delete(id);
        }
        state.words = state.words.map((item) => item.id === id ? { ...word, id } : item);
      } else state.words = [...state.words, { ...word, id }];
      entryDialog.close();
      notify(editingId ? 'Đã cập nhật từ vựng.' : 'Đã thêm từ vào sổ tay.');
      onChange();
    } catch (error) {
      $('#entry-error').textContent = error.message;
    }
  });

  $('#import-file').addEventListener('change', async (event) => {
    const input = event.target;
    const file = input.files[0];
    const version = ++importFileVersion;
    if (!file) return;
    try {
      if (file.size > importLimit * 4) throw new Error('Tệp quá lớn. Giới hạn 250.000 ký tự.');
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (version !== importFileVersion || !importDialog.open) return;
      if (decoded.length > importLimit) throw new Error('Tệp quá lớn. Giới hạn 250.000 ký tự.');
      importForm.elements.namedItem('list').value = decoded;
      $('#import-error').textContent = '';
    } catch (error) {
      if (version === importFileVersion && importDialog.open) {
        $('#import-error').textContent = error instanceof TypeError ? 'Tệp phải dùng mã hóa UTF-8.' : error.message;
      }
    } finally {
      if (version === importFileVersion) input.value = '';
    }
  });
  importDialog.addEventListener('close', () => { importFileVersion++; });

  importForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const imported = parseImport(importForm.elements.namedItem('list').value);
      const additions = uniqueImports(imported, state.words).map((word) => ({ ...word, id: uniqueId() }));
      state.words = [...state.words, ...additions];
      importDialog.close();
      const skipped = imported.length - additions.length;
      notify(`Đã nhập ${additions.length} từ${skipped ? `, bỏ qua ${skipped} từ trùng` : ''}.`);
      onChange();
    } catch (error) {
      $('#import-error').textContent = error.message;
    }
  });

  $('#delete-form').addEventListener('submit', (event) => {
    event.preventDefault();
    state.words = state.words.filter((word) => word.id !== deletingId);
    state.known.delete(deletingId);
    state.correctAnswers.delete(deletingId);
    state.dictationDrafts.delete(deletingId);
    deleteDialog.close();
    notify('Đã xóa từ khỏi sổ tay.');
    onChange();
  });

  $('#delete-all-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const count = state.words.length;
    state.words = [];
    state.known.clear();
    state.correctAnswers.clear();
    state.dictationDrafts.clear();
    deleteAllDialog.close();
    notify(`Đã xóa toàn bộ ${count} thẻ khỏi sổ tay.`);
    onChange();
  });

  return { openEntry, openImport, openDelete, openDeleteAll };
}
