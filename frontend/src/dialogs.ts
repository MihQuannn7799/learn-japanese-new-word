import { findKanji } from './dictionary.ts';
import { importLimit, parseImport, uniqueImports } from './lib/import.ts';
import { makeWord, wordKey } from '../../shared/word.ts';
import { escapeHtml } from './views/shared.ts';
import { wordById } from './state.ts';
import { field, query } from './lib/dom.ts';
import { errorMessage } from './lib/errors.ts';
import type { DialogOptions, Word, WordFields } from './types.ts';

const $ = query;
const uniqueId = () => globalThis.crypto?.randomUUID?.() ?? `word-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function initDialogs({ state, notify, onChange }: DialogOptions) {
  const entryDialog = $<HTMLDialogElement>('#entry-dialog');
  const importDialog = $<HTMLDialogElement>('#import-dialog');
  const deleteDialog = $<HTMLDialogElement>('#delete-dialog');
  const deleteAllDialog = $<HTMLDialogElement>('#delete-all-dialog');
  const entryForm = $<HTMLFormElement>('#entry-form');
  const importForm = $<HTMLFormElement>('#import-form');

  let editingId = '';
  let entrySource: WordFields | undefined;
  let deletingId = '';
  let importFileVersion = 0;
  let lookupVersion = 0;
  const kanaInput = field(entryForm, 'kana');
  const kanjiInput = field(entryForm, 'kanji');
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
        `<button type="button" class="btn secondary kanji-choice" data-kanji="${escapeHtml(kanji)}"><strong lang="ja">${escapeHtml(kanji)}</strong><span lang="vi">${escapeHtml(meaning)}</span><span class="badge">${escapeHtml(level)}</span></button>`
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
    if (!(event.target instanceof Element)) return;
    const choice = event.target.closest<HTMLButtonElement>('button[data-kanji]');
    if (!choice) return;
    kanjiInput.value = choice.dataset.kanji ?? '';
    kanjiInput.focus();
  });
  entryDialog.addEventListener('close', () => { lookupVersion++; });

  function openEntry(word?: Word, initial: WordFields | undefined = word) {
    editingId = word?.id ?? '';
    entrySource = initial;
    entryForm.reset();
    $('#entry-title').textContent = word ? 'Sửa từ vựng' : 'Thêm từ mới';
    $('#entry-error').textContent = '';
    for (const name of ['kana', 'meaning', 'kanji', 'example', 'exampleMeaning'] as const) field(entryForm, name).value = initial?.[name] ?? '';
    field<HTMLSelectElement>(entryForm, 'meaningLanguage').value = initial?.meaningLanguage === 'en' ? 'en' : 'vi';
    entryDialog.showModal();
    void lookupKanji();
  }

  function openImport() {
    importForm.reset();
    $('#import-error').textContent = '';
    importDialog.showModal();
  }

  function openDelete(word: Word) {
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
    const value = (name: string) => String(fields.get(name) ?? '');
    try {
      const base = makeWord(value('kana'), value('meaning'), value('kanji'));
      const { display, displayKana, hanViet, lesson, alternateKana, alternateKanji } = entrySource ?? {};
      const word: WordFields = entrySource?.kana === base.kana && entrySource.kanji === base.kanji
        ? { ...base, display, displayKana, hanViet, lesson, alternateKana, alternateKanji } : base;
      word.meaningLanguage = value('meaningLanguage') === 'en' ? 'en' : 'vi';
      const example = value('example').trim();
      const exampleMeaning = value('exampleMeaning').trim();
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
        if (previous && wordKey(previous) !== wordKey(word)) {
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
      $('#entry-error').textContent = errorMessage(error);
    }
  });

  $<HTMLInputElement>('#import-file').addEventListener('change', async (event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    const version = ++importFileVersion;
    if (!file) return;
    try {
      if (file.size > importLimit * 4) throw new Error('Tệp quá lớn. Giới hạn 250.000 ký tự.');
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (version !== importFileVersion || !importDialog.open) return;
      if (decoded.length > importLimit) throw new Error('Tệp quá lớn. Giới hạn 250.000 ký tự.');
      field<HTMLTextAreaElement>(importForm, 'list').value = decoded;
      $('#import-error').textContent = '';
    } catch (error) {
      if (version === importFileVersion && importDialog.open) {
        $('#import-error').textContent = error instanceof TypeError ? 'Tệp phải dùng mã hóa UTF-8.' : errorMessage(error);
      }
    } finally {
      if (version === importFileVersion) input.value = '';
    }
  });
  importDialog.addEventListener('close', () => { importFileVersion++; });

  importForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const imported = parseImport(field<HTMLTextAreaElement>(importForm, 'list').value);
      const additions = uniqueImports(imported, state.words).map((word) => ({ ...word, id: uniqueId() }));
      state.words = [...state.words, ...additions];
      importDialog.close();
      const skipped = imported.length - additions.length;
      notify(`Đã nhập ${additions.length} từ${skipped ? `, bỏ qua ${skipped} từ trùng` : ''}.`);
      onChange();
    } catch (error) {
      $('#import-error').textContent = errorMessage(error);
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
