import { flashProgress } from '../state.ts';
import { escapeHtml, icon, japanese } from './shared.ts';
import type { FlashFilter, StudyState, Word } from '../types.ts';

const filters: ReadonlyArray<readonly [FlashFilter, string]> = [
  ['random', 'Ngẫu nhiên'],
  ['unknown', 'Chưa nhớ'],
  ['known', 'Đã nhớ'],
];

function cardBack(word: Word): string {
  return `<span class="card-meaning" lang="${word.meaningLanguage === 'en' ? 'en' : 'vi'}">${escapeHtml(word.meaning)}</span>
    <span class="kana" lang="ja">${escapeHtml(word.displayKana || word.kana)}</span>
    ${word.hanViet ? `<span class="word-hanviet">${escapeHtml(word.hanViet)}</span>` : ''}
    ${word.example ? `<span class="flash-example">
      <span lang="ja">${escapeHtml(word.example)}</span>
      ${word.exampleMeaning ? `<span class="muted" lang="vi">${escapeHtml(word.exampleMeaning)}</span>` : ''}
    </span>` : ''}`;
}

function cardFront(word: Word): string {
  return `${japanese({ ...word, hanViet: '' })}
    ${word.example ? `<span class="flash-example flash-example-front" lang="ja">${escapeHtml(word.example)}</span>` : ''}`;
}

function swipeCard({ flipped, flashIndex }: StudyState, word: Word, total: number): string {
  return `<div class="flash-deck">
    <div class="flash-face${flipped ? ' flipped' : ''}">
      <button type="button" class="card-toggle" data-action="flip" id="flip-card" aria-label="${flipped ? 'Lật về mặt tiếng Nhật' : 'Lật để xem nghĩa và ví dụ'}" aria-describedby="card-answer">
        <span id="card-answer">${flipped ? cardBack(word) : cardFront(word)}</span>
        <span class="flip-hint">${icon('flip')} ${flipped ? 'Chạm để xem mặt trước' : 'Chạm thẻ để xem nghĩa'}</span>
      </button>
      <div class="flash-audio-actions">
        <button type="button" class="btn secondary" data-action="speak">${icon('volume')} Nghe từ</button>
        ${word.example ? `<button type="button" class="btn secondary" data-action="speak-example">${icon('volume')} Nghe câu</button>` : ''}
      </div>
      <div class="face-top">
        <span class="flash-position" aria-label="Thẻ ${flashIndex + 1} trên ${total}">${flashIndex + 1} / ${total}</span>
      </div>
      <span class="swipe-label swipe-label-left" aria-hidden="true">${icon('left')} Chưa nhớ</span>
      <span class="swipe-label swipe-label-right" aria-hidden="true">Đã nhớ ${icon('right')}</span>
    </div>
  </div>
  <div class="flash-actions">
    <button type="button" class="btn flash-unknown" data-action="flash-unknown">${icon('left')} Chưa nhớ</button>
    <button type="button" class="btn primary" data-action="flash-known">Đã nhớ ${icon('right')}</button>
  </div>
  <p class="shortcut-tip flash-shortcuts">${icon('keyboard')} <span><kbd>←</kbd> Chưa nhớ · <kbd>Space</kbd> Lật thẻ · <kbd>→</kbd> Đã nhớ</span></p>
  <p class="voice-message" data-voice-message role="status" hidden></p>`;
}

function sessionEnd(filter: FlashFilter, total: number): string {
  const title = total ? 'Đã hết thẻ trong lượt này'
    : filter === 'known' ? 'Chưa có từ đã nhớ' : 'Không còn từ chưa nhớ';
  return `<div class="flash-deck"><div class="flash-end">
    <h3 id="flash-session-end" tabindex="-1">${title}</h3>
    ${total ? '<button type="button" class="btn secondary" data-action="flash-restart">Học lại bộ này</button>'
      : '<p class="muted">Chọn một bộ thẻ khác để tiếp tục.</p>'}
  </div></div>`;
}

export function flashView(state: StudyState, word: Word | undefined): string {
  const { remembered, total, percent } = flashProgress(state);
  return `<section class="flash-study" aria-label="Thẻ từ vựng">
    <div class="flash-toolbar">
      <div class="flash-filters" role="group" aria-label="Bộ thẻ">
        ${filters.map(([id, label]) => `<button type="button" class="flash-filter" data-action="flash-filter" data-filter="${id}" aria-pressed="${id === state.flashFilter}">${label}</button>`).join('')}
      </div>
      <div class="flash-progress">
        <p class="flash-progress-label" role="status"><span>${remembered}/${total} từ đã nhớ</span><strong>${percent}%</strong></p>
        <progress max="${total || 1}" value="${remembered}" aria-label="Từ đã nhớ trong bộ thẻ"></progress>
      </div>
    </div>
    ${word ? swipeCard(state, word, total) : sessionEnd(state.flashFilter, total)}
  </section>`;
}
