import { loadN5, loadN5Lessons, newCatalogWords, spellingKey, wordsInLesson } from './dictionary.ts';
import { normalizeSearch } from '../../shared/kana.ts';
import { escapeHtml } from './views/shared.ts';
import { query } from './lib/dom.ts';
import type { DialogOptions, Lesson, Word, WordFields } from './types.ts';

const pageSize = 24;

export function initCatalog({ state, openEntry, notify, onChange }: DialogOptions & { openEntry: (word?: Word, initial?: WordFields) => void }) {
  const dialog = query<HTMLDialogElement>('#n5-dialog');
  const search = query<HTMLInputElement>('input[type="search"]', dialog);
  const lessonSelect = query<HTMLSelectElement>('#n5-lesson', dialog);
  const rows = query('.catalog-rows', dialog);
  const status = query('.catalog-status', dialog);
  const bulk = query<HTMLButtonElement>('[data-action="n5-bulk"]', dialog);
  const previous = query<HTMLButtonElement>('[data-action="n5-prev"]', dialog);
  const next = query<HTMLButtonElement>('[data-action="n5-next"]', dialog);
  let catalog: Word[] = [];
  let lessons: Lesson[] = [];
  let page = 0;

  const selectedLesson = () => lessons.find(({ number }) => number === Number(lessonSelect.value));

  function render() {
    const lesson = selectedLesson();
    const scope = wordsInLesson(catalog, lesson);
    const query = normalizeSearch(search.value);
    const matches = scope.filter((word) => [word.kana, word.kanji, word.meaning]
      .some((value) => normalizeSearch(value).includes(query)));
    const total = Math.ceil(matches.length / pageSize);
    page = Math.min(page, Math.max(0, total - 1));
    const owned = new Set(state.words.map(spellingKey));
    rows.innerHTML = matches.slice(page * pageSize, (page + 1) * pageSize).map((word) => {
      const exists = owned.has(spellingKey(word));
      return `<li><div><strong lang="ja">${escapeHtml(word.kanji || word.kana)}</strong>
        ${word.kanji ? `<span class="muted" lang="ja">${escapeHtml(word.kana)}</span>` : ''}
        <p class="muted" lang="en">${escapeHtml(word.meaning)}</p></div>
        <button class="btn secondary" type="button" data-action="n5-add" data-id="${escapeHtml(word.id)}" ${exists ? 'disabled' : ''}>${exists ? 'Đã có' : 'Thêm'}</button></li>`;
    }).join('');
    const label = lesson ? `Bài ${lesson.number} · ` : '';
    status.textContent = matches.length
      ? `${label}${matches.length} từ · Trang ${page + 1}/${total}`
      : `${label}Không tìm thấy từ phù hợp.`;
    previous.disabled = page === 0;
    next.disabled = page + 1 >= total;
    bulk.disabled = !scope.length;
    bulk.textContent = lesson ? `Thêm cả bài ${lesson.number}` : 'Thêm cả bộ N5';
  }

  async function open() {
    search.value = '';
    page = 0;
    dialog.showModal();
    if (catalog.length) {
      render();
      return;
    }
    status.textContent = 'Đang tải kho N5…';
    try {
      [catalog, lessons] = await Promise.all([loadN5(), loadN5Lessons()]);
      for (const { number, title, wordIds } of lessons) {
        lessonSelect.add(new Option(`Bài ${number} · ${title} (${wordIds.length} từ)`, String(number)));
      }
      lessonSelect.disabled = false;
      render();
    } catch {
      status.textContent = 'Không tải được kho N5. Hãy đóng và mở lại để thử.';
    }
  }

  search.addEventListener('input', () => {
    if (!catalog.length) return;
    page = 0;
    render();
  });
  lessonSelect.addEventListener('change', () => {
    page = 0;
    render();
  });

  dialog.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('button[data-action]');
    if (!button || button.disabled) return;
    switch (button.dataset.action) {
      case 'n5-prev': page--; render(); break;
      case 'n5-next': page++; render(); break;
      case 'n5-add': {
        const word = catalog.find((item) => item.id === button.dataset.id);
        if (!word) return;
        dialog.close();
        openEntry(undefined, word);
        break;
      }
      case 'n5-bulk': {
        const lesson = selectedLesson();
        const additions = newCatalogWords(wordsInLesson(catalog, lesson), state.words);
        if (!additions.length) {
          notify(lesson ? `Các từ của bài ${lesson.number} đã có trong sổ tay.` : 'Các từ trong kho N5 đã có trong sổ tay.');
          return;
        }
        state.words = [...state.words, ...additions];
        dialog.close();
        notify(lesson ? `Đã thêm ${additions.length} từ của bài ${lesson.number}.` : `Đã thêm ${additions.length} từ N5.`);
        onChange();
        break;
      }
    }
  });
  return open;
}
