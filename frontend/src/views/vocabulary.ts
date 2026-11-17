import { normalizeSearch } from '../../../shared/kana.ts';
import { escapeHtml, icon } from './shared.ts';
import type { StudyState } from '../types.ts';
import { layoutButtons, wordCard } from './word-card.ts';

export function rowsView({ search, words, known, vocabularyLayout }: StudyState): string {
  const query = normalizeSearch(search);
  const visible = words.filter((word) =>
    [word.kana, word.meaning, word.kanji, word.display ?? '', word.hanViet ?? ''].some((value) => normalizeSearch(value).includes(query))
  );
  if (vocabularyLayout === 'cards') {
    return visible.map((word, index) => wordCard(word, {
      position: index + 1,
      known: known.has(word.id),
      actionsHtml: `<button class="btn secondary" type="button" data-action="edit" data-id="${escapeHtml(word.id)}">${icon('pen')} Sửa</button>
        <button class="btn plain icon-only" type="button" data-action="delete" data-id="${escapeHtml(word.id)}" aria-label="Xóa ${escapeHtml(word.kana)}">${icon('trash')}</button>`,
    })).join('') || `<li class="empty-state">${words.length ? 'Không tìm thấy từ phù hợp.' : 'Sổ tay chưa có từ. Thêm từ mới hoặc nhập danh sách để bắt đầu.'}</li>`;
  }
  return visible.map((word) => `<tr>
    <td lang="ja"><button class="word-pronunciation" type="button" data-action="speak" data-id="${escapeHtml(word.id)}" title="Nghe phát âm">${escapeHtml(word.display || word.kanji || word.kana)}</button>${known.has(word.id) ? '<span class="badge known">Đã nhớ</span>' : ''}</td>
    <td lang="ja">${escapeHtml(word.displayKana || word.kana)}</td>
    <td class="word-hanviet">${escapeHtml(word.hanViet || '—')}</td>
    <td lang="${word.meaningLanguage === 'en' ? 'en' : 'vi'}">${escapeHtml(word.meaning)}</td>
    <td><div class="inline-actions">
      <button class="btn plain icon-only" data-action="speak" data-id="${escapeHtml(word.id)}" aria-label="Nghe ${escapeHtml(word.kana)}" title="Nghe phát âm">${icon('volume')}</button>
      <button class="btn plain icon-only" data-action="edit" data-id="${escapeHtml(word.id)}" aria-label="Sửa ${escapeHtml(word.kana)}" title="Sửa từ">${icon('pen')}</button>
      <button class="btn plain icon-only" data-action="delete" data-id="${escapeHtml(word.id)}" aria-label="Xóa ${escapeHtml(word.kana)}" title="Xóa từ">${icon('trash')}</button>
    </div></td></tr>`).join('') || `<tr><td class="no-results" colspan="5">${words.length ? 'Không tìm thấy từ phù hợp.' : 'Sổ tay chưa có từ. Thêm từ mới hoặc nhập danh sách để bắt đầu.'}</td></tr>`;
}

export function vocabularyView(state: StudyState): string {
  const { search, words } = state;
  return `<section class="book-panel">
    <div class="book-tools">
      <label class="search">${icon('search')}<input id="word-search" type="search" placeholder="Tìm kana, nghĩa hoặc kanji…" aria-label="Tìm từ vựng" value="${escapeHtml(search)}"></label>
      <div class="inline-actions">
        ${layoutButtons('vocabulary-layout', state.vocabularyLayout)}
        <span class="muted">${words.length} từ trong sổ tay</span>
        <button class="btn danger" type="button" data-action="delete-all" ${words.length ? '' : 'disabled'}>${icon('trash')} Xóa toàn bộ thẻ</button>
      </div>
    </div>
    ${state.vocabularyLayout === 'cards' ? `<ul class="word-cards" id="word-rows">${rowsView(state)}</ul>` : `<div class="table-wrap" tabindex="0" role="region" aria-label="Bảng từ vựng">
      <table class="word-table"><thead><tr><th scope="col">Từ tiếng Nhật</th><th scope="col">Cách đọc</th><th scope="col">Âm Hán Việt</th><th scope="col">Nghĩa tiếng Việt</th><th scope="col">Thao tác</th></tr></thead>
      <tbody id="word-rows">${rowsView(state)}</tbody></table>
    </div>`}
  </section>`;
}
