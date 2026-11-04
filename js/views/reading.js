import { escapeHtml, icon, japanese, speedPanel, stepper } from './shared.js';

export function readingView({ words, readingIndex, speed }, word) {
  return `<div class="study-grid">
    <section class="study-card" aria-label="Trình đọc từ vựng">
      <div class="exercise-listen reading">
        <span class="badge" id="reading-status" aria-live="polite">SẴN SÀNG</span>
        ${japanese(word)}
        <p>${escapeHtml(word.meaning)}</p>
      </div>
      <div class="exercise-body">
        <div class="reading-actions">
          <button class="btn primary" data-action="play-list">${icon('play')} Đọc liên tiếp</button>
          <button class="btn secondary" data-action="speak">${icon('volume')} Đọc từ này</button>
        </div>
        <div class="card-controls">${stepper(readingIndex, words.length)}</div>
      </div>
    </section>
    <aside class="side-stack">
      ${speedPanel(speed)}
      <section class="panel">
        <h3 class="panel-title">${icon('book')} Danh sách đọc</h3>
        <ol class="playlist">
          ${words.map((item, index) => `<li><button data-action="choose-word" data-index="${index}" aria-current="${index === readingIndex}"><span class="position">${index + 1}</span><span lang="ja">${escapeHtml(item.kanji || item.kana)}</span><span class="muted">${escapeHtml(item.meaning)}</span></button></li>`).join('')}
        </ol>
      </section>
    </aside>
  </div>`;
}
