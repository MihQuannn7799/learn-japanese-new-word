import { escapeHtml, icon, japanese, progressPanel, speedPanel, stepper } from './shared.js';

export function flashView({ words, known, flipped, flashIndex, flashOrder, speed }, word) {
  const remembered = known.has(word.id);
  return `<div class="study-grid">
    <section class="study-card" aria-label="Thẻ từ vựng">
      <div class="flash-face ${flipped ? 'flipped' : ''}">
        <button class="card-toggle" data-action="flip" id="flip-card" aria-label="${flipped ? 'Lật về mặt tiếng Nhật' : 'Lật để xem nghĩa'}" aria-describedby="card-answer">
          <span id="card-answer">
            ${flipped ? `<span class="card-meaning">${escapeHtml(word.meaning)}</span><span class="kana" lang="ja">${escapeHtml(word.kana)}</span>` : japanese(word)}
          </span>
          <span class="flip-hint">${icon('flip')} ${flipped ? 'Chạm để xem mặt tiếng Nhật' : 'Chạm để xem nghĩa'}</span>
        </button>
        <div class="face-top">
          <span class="badge">${flipped ? 'MẶT NGHĨA' : 'MẶT TIẾNG NHẬT'}</span>
          <button class="btn icon-only secondary" data-action="speak" aria-label="Nghe phát âm" title="Nghe phát âm">${icon('volume')}</button>
        </div>
      </div>
      <div class="card-controls">
        ${stepper(flashIndex, flashOrder.length)}
        <button id="known-button" class="btn ${remembered ? 'subtle' : 'secondary'}" data-action="known" aria-pressed="${remembered}">${icon('check')} ${remembered ? 'Đã nhớ' : 'Đánh dấu đã nhớ'}</button>
      </div>
    </section>
    <aside class="side-stack">
      ${progressPanel({ words, known })}
      ${speedPanel(speed)}
      <p class="shortcut-tip">${icon('keyboard')} <span><kbd>←</kbd> <kbd>→</kbd> đổi từ · <kbd>Space</kbd> lật thẻ</span></p>
    </aside>
  </div>`;
}
