export const speedText = (speed) => `${Number(speed.toFixed(2))}×`;
export const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="./icons.svg#i-${name}"/></svg>`;
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]
);

export function speedPanel(speed) {
  return `<section class="panel">
    <label class="range-label" for="speed"><span class="panel-title">${icon('volume')} Tốc độ đọc</span><output id="speed-value" for="speed">${speedText(speed)}</output></label>
    <input id="speed" type="range" min="0.5" max="1.5" step="0.05" value="${speed}" aria-valuetext="${speedText(speed)}">
    <div class="speed-scale" aria-hidden="true"><span>0.5× · Chậm</span><span>1.5× · Nhanh</span></div>
    <p class="voice-message" data-voice-message role="status" hidden></p>
  </section>`;
}

export function progressPanel({ words, known, correctAnswers }, isDictation = false) {
  const count = isDictation ? correctAnswers.size : words.filter((word) => known.has(word.id)).length;
  const title = isDictation ? 'Kết quả phiên này' : 'Tiến độ sổ tay';
  const label = isDictation ? 'từ trả lời đúng' : 'từ đã nhớ';
  const message = isDictation ? 'Bạn có thể nghe lại và thử nhiều lần.' : 'Đánh dấu những từ bạn đã nhớ nghĩa.';
  return `<section class="panel">
    <h3 class="panel-title">${icon(isDictation ? 'check' : 'book')} ${title}</h3>
    <div class="progress-row"><strong>${count}/${words.length}</strong><span>${label}</span></div>
    <progress max="${words.length}" value="${count}" aria-label="${label}"></progress>
    <p>${message}</p>
  </section>`;
}

export function stepper(position, size) {
  return `<div class="inline-actions">
    <button class="btn icon-only secondary" data-action="previous" aria-label="Từ trước" ${position === 0 ? 'disabled' : ''}>${icon('left')}</button>
    <span class="position" aria-live="polite">${position + 1} / ${size}</span>
    <button class="btn icon-only secondary" data-action="next" aria-label="Từ tiếp theo" ${position >= size - 1 ? 'disabled' : ''}>${icon('right')}</button>
  </div>`;
}

export function japanese(word) {
  return `<span class="jp-word" lang="ja">${escapeHtml(word.kanji || word.kana)}</span>
    ${word.kanji ? `<span class="kana" lang="ja">${escapeHtml(word.kana)}</span>` : ''}`;
}
