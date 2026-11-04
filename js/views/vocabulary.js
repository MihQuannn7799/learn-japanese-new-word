import { normalizeSearch } from '../lib/kana.js';
import { escapeHtml, icon } from './shared.js';

export function rowsView({ search, words, known }) {
  const query = normalizeSearch(search);
  const visible = words.filter((word) =>
    [word.kana, word.meaning, word.kanji].some((value) => normalizeSearch(value).includes(query))
  );
  return visible.map((word) => `<tr>
    <td lang="ja">${escapeHtml(word.kana)}</td>
    <td>${escapeHtml(word.meaning)}</td>
    <td lang="${word.kanji ? 'ja' : 'vi'}">${word.kanji ? escapeHtml(word.kanji) : '<span aria-label="Không có kanji">—</span>'}</td>
    <td>${known.has(word.id) ? '<span class="badge known">Đã nhớ</span>' : '—'}</td>
    <td><div class="inline-actions">
      <button class="btn plain icon-only" data-action="speak" data-id="${escapeHtml(word.id)}" aria-label="Nghe ${escapeHtml(word.kana)}" title="Nghe phát âm">${icon('volume')}</button>
      <button class="btn plain icon-only" data-action="edit" data-id="${escapeHtml(word.id)}" aria-label="Sửa ${escapeHtml(word.kana)}" title="Sửa từ">${icon('pen')}</button>
      <button class="btn plain icon-only" data-action="delete" data-id="${escapeHtml(word.id)}" aria-label="Xóa ${escapeHtml(word.kana)}" title="Xóa từ">${icon('trash')}</button>
    </div></td></tr>`).join('') || `<tr><td class="no-results" colspan="5">${words.length ? 'Không tìm thấy từ phù hợp.' : 'Sổ tay chưa có từ. Thêm từ mới hoặc nhập danh sách để bắt đầu.'}</td></tr>`;
}

export function vocabularyView(state) {
  const { search, words } = state;
  return `<section class="book-panel">
    <div class="book-tools">
      <label class="search">${icon('search')}<input id="word-search" type="search" placeholder="Tìm kana, nghĩa hoặc kanji…" aria-label="Tìm từ vựng" value="${escapeHtml(search)}"></label>
      <span class="muted">${words.length} từ trong sổ tay</span>
    </div>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Bảng từ vựng">
      <table class="word-table"><thead><tr><th scope="col">Từ tiếng Nhật</th><th scope="col">Nghĩa tiếng Việt</th><th scope="col">Kanji</th><th scope="col">Tiến độ</th><th scope="col">Thao tác</th></tr></thead>
      <tbody id="word-rows">${rowsView(state)}</tbody></table>
    </div>
  </section>`;
}
