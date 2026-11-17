import { loadMinna, loadMinnaLessons, newCatalogWords, spellingKey, wordsInLesson } from './dictionary.ts';
import { normalizeSearch } from '../../shared/kana.ts';
import { escapeHtml, icon } from './views/shared.ts';
import { query } from './lib/dom.ts';
import type { DialogOptions, Lesson, Word, WordFields } from './types.ts';
import { layoutButtons, wordCard } from './views/word-card.ts';

const pageSize = 24;

export function initCatalog({ state, openEntry, notify, onChange, speak, stopAudio }: DialogOptions & {
  openEntry: (word?: Word, initial?: WordFields) => void;
  speak: (text: string) => void;
  stopAudio: () => void;
}) {
  const dialog = query<HTMLDialogElement>('#n5-dialog');
  const search = query<HTMLInputElement>('input[type="search"]', dialog);
  const lessonSelect = query<HTMLSelectElement>('#n5-lesson', dialog);
  const rows = query('.catalog-rows', dialog);
  const status = query('.catalog-status', dialog);
  const bulk = query<HTMLButtonElement>('[data-action="n5-bulk"]', dialog);
  const previous = query<HTMLButtonElement>('[data-action="n5-prev"]', dialog);
  const next = query<HTMLButtonElement>('[data-action="n5-next"]', dialog);
  const lessonGrid = query('#n5-lesson-grid', dialog);
  const layoutControl = query('[data-catalog-layout]', dialog);
  const kanaToggle = query<HTMLInputElement>('#n5-show-kana', dialog);
  let catalog: Word[] = [];
  let lessons: Lesson[] = [];
  let page = 0;
  let layout: 'cards' | 'list' = 'cards';
  let loading: Promise<void> | null = null;

  const selectedLesson = () => lessons.find(({ number }) => number === Number(lessonSelect.value));

  function render() {
    const lesson = selectedLesson();
    const scope = wordsInLesson(catalog, lesson);
    const query = normalizeSearch(search.value);
    const matches = scope.filter((word) => [word.kana, word.kanji, word.meaning, word.display ?? '', word.hanViet ?? '']
      .some((value) => normalizeSearch(value).includes(query)));
    const total = Math.ceil(matches.length / pageSize);
    page = Math.min(page, Math.max(0, total - 1));
    const owned = new Set(state.words.map(spellingKey));
    const visible = matches.slice(page * pageSize, (page + 1) * pageSize);
    const entries = visible.map((word, index) => {
      const exists = owned.has(spellingKey(word));
      const add = `<button class="btn secondary" type="button" data-action="n5-add" data-id="${escapeHtml(word.id)}" ${exists ? 'disabled' : ''}>${exists ? 'Đã có' : 'Thêm vào sổ tay'}</button>`;
      if (layout === 'cards') return wordCard(word, {
        position: page * pageSize + index + 1,
        speakAction: 'n5-speak', exampleAction: 'n5-example', actionsHtml: add,
      });
      return `<tr><td lang="ja"><strong>${escapeHtml(word.display || word.kanji || word.kana)}</strong></td>
        <td lang="ja">${escapeHtml(word.displayKana || word.kana)}</td><td class="word-hanviet">${escapeHtml(word.hanViet || '—')}</td>
        <td lang="vi">${escapeHtml(word.meaning)}</td><td><div class="inline-actions"><button class="btn plain icon-only" type="button" data-action="n5-speak" data-id="${escapeHtml(word.id)}" aria-label="Nghe ${escapeHtml(word.kana)}">${icon('volume')}</button>${add}</div></td></tr>`;
    }).join('');
    rows.innerHTML = layout === 'cards' ? `<ul class="word-cards">${entries}</ul>`
      : `<div class="table-wrap" tabindex="0" role="region" aria-label="Danh sách từ theo bài"><table class="word-table catalog-table"><thead><tr><th scope="col">Từ tiếng Nhật</th><th scope="col">Cách đọc</th><th scope="col">Âm Hán Việt</th><th scope="col">Nghĩa tiếng Việt</th><th scope="col">Thao tác</th></tr></thead><tbody>${entries}</tbody></table></div>`;
    layoutControl.innerHTML = layoutButtons('n5-layout', layout);
    lessonGrid.innerHTML = lessons.map(({ number }) => `<button class="lesson-number" type="button" data-action="n5-lesson" data-number="${number}" aria-pressed="${lesson?.number === number}">${number}</button>`).join('');
    const label = lesson ? `Bài ${lesson.number} · ` : '';
    status.textContent = matches.length
      ? `${label}${matches.length} từ · Trang ${page + 1}/${total}`
      : `${label}Không tìm thấy từ phù hợp.`;
    previous.disabled = page === 0;
    next.disabled = page + 1 >= total;
    bulk.disabled = !scope.length;
    bulk.textContent = lesson ? `Thêm cả bài ${lesson.number}` : 'Thêm cả 50 bài';
  }

  async function open() {
    search.value = '';
    page = 0;
    dialog.showModal();
    if (catalog.length) {
      render();
      return;
    }
    status.textContent = 'Đang tải kho từ Nhật–Việt…';
    try {
      if (!loading) {
        loading = (async () => {
          [catalog, lessons] = await Promise.all([loadMinna(), loadMinnaLessons()]);
          lessonSelect.replaceChildren(new Option('Tất cả 50 bài', ''));
          for (const { number, title, wordIds } of lessons) {
            lessonSelect.add(new Option(`Bài ${number} · ${title.replace(/^Bài \d+:\s*/, '')} (${wordIds.length} mục)`, String(number)));
          }
          lessonSelect.disabled = false;
        })().finally(() => { loading = null; });
      }
      await loading;
      render();
    } catch {
      status.textContent = 'Không tải được kho từ. Hãy đóng và mở lại để thử.';
    }
  }

  search.addEventListener('input', () => {
    if (!catalog.length) return;
    page = 0;
    render();
    rows.scrollTop = 0;
  });
  lessonSelect.addEventListener('change', () => {
    page = 0;
    render();
    rows.scrollTop = 0;
  });
  kanaToggle.addEventListener('change', () => rows.classList.toggle('hide-card-kana', !kanaToggle.checked));

  dialog.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('button[data-action]');
    if (!button || button.disabled) return;
    switch (button.dataset.action) {
      case 'n5-layout':
        layout = button.dataset.layout === 'list' ? 'list' : 'cards';
        render();
        query<HTMLButtonElement>(`[data-action="n5-layout"][data-layout="${layout}"]`, dialog).focus({ preventScroll: true });
        break;
      case 'n5-lesson':
        lessonSelect.value = button.dataset.number ?? '';
        page = 0;
        render();
        rows.scrollTop = 0;
        query<HTMLButtonElement>(`[data-action="n5-lesson"][data-number="${lessonSelect.value}"]`, dialog).focus({ preventScroll: true });
        query(`[data-action="n5-lesson"][data-number="${lessonSelect.value}"]`, dialog).scrollIntoView({ block: 'nearest', inline: 'nearest' });
        break;
      case 'n5-speak':
      case 'n5-example': {
        const word = catalog.find(({ id }) => id === button.dataset.id);
        const text = button.dataset.action === 'n5-example' ? word?.example : word?.kana;
        if (text) speak(text);
        break;
      }
      case 'n5-prev': page--; render(); rows.scrollTop = 0; break;
      case 'n5-next': page++; render(); rows.scrollTop = 0; break;
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
          notify(lesson ? `Các từ của bài ${lesson.number} đã có trong sổ tay.` : 'Các từ trong kho Minna đã có trong sổ tay.');
          return;
        }
        state.words = [...state.words, ...additions];
        dialog.close();
        notify(lesson ? `Đã thêm ${additions.length} từ của bài ${lesson.number}.` : `Đã thêm ${additions.length} từ Minna.`);
        onChange();
        break;
      }
    }
  });
  dialog.addEventListener('close', stopAudio);
  return open;
}
