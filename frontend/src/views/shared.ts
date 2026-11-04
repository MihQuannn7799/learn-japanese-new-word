import { wordGaps } from '../../../shared/settings.ts';
import type { StudyState, Word } from '../types.ts';

export const speedText = (speed: number) => `${Number(speed.toFixed(2))}×`;
export const icon = (name: string) => `<svg class="icon" aria-hidden="true"><use href="./icons.svg#i-${name}"/></svg>`;
const htmlEntities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value: unknown): string => String(value).replace(/[&<>"']/g, (character) => htmlEntities[character]);

export const speedFill = (speed: number) => `${Math.round((speed - 0.5) * 100)}%`;

export function speedPanel({ speed, repeats, wordGap }: Pick<StudyState, 'speed' | 'repeats' | 'wordGap'>): string {
  return `<section class="panel">
    <label class="range-label" for="speed"><span class="panel-title">${icon('volume')} Tốc độ danh sách</span><output id="speed-value" for="speed">${speedText(speed)}</output></label>
    <input id="speed" class="speed-slider" type="range" min="0.5" max="1.5" step="0.01" value="${speed}" style="--speed-fill: ${speedFill(speed)}" aria-valuetext="${speedText(speed)}">
    <div class="speed-scale" aria-hidden="true"><span>0.5× · Chậm</span><span>1.5× · Nhanh</span></div>
    <label class="repeat-setting" for="repeats"><span>Số lần đọc mỗi từ</span>
      <select id="repeats">
        ${[1, 2, 3, 4, 5].map((count) => `<option value="${count}"${count === repeats ? ' selected' : ''}>${count} lần</option>`).join('')}
      </select>
    </label>
    <label class="repeat-setting" for="word-gap"><span>Nghỉ giữa hai từ</span>
      <select id="word-gap">
        ${wordGaps.map((gap) => `<option value="${gap}"${gap === wordGap ? ' selected' : ''}>${gap === 0 ? 'Liền nhau' : `${(gap / 1000).toLocaleString('vi-VN')} giây`}</option>`).join('')}
      </select>
    </label>
    <p>Nghe riêng từng từ dùng tốc độ 1×.</p>
    <p class="voice-message" data-voice-message role="status" hidden></p>
  </section>`;
}

export function progressPanel({ words, known, correctAnswers }: Pick<StudyState, 'words' | 'known'> & Partial<Pick<StudyState, 'correctAnswers'>>, isDictation = false): string {
  const count = isDictation ? correctAnswers?.size ?? 0 : words.filter((word) => known.has(word.id)).length;
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

export function stepper(position: number, size: number): string {
  return `<div class="inline-actions">
    <button class="btn icon-only secondary" data-action="previous" aria-label="Từ trước" ${position === 0 ? 'disabled' : ''}>${icon('left')}</button>
    <span class="position" aria-live="polite">${position + 1} / ${size}</span>
    <button class="btn icon-only secondary" data-action="next" aria-label="Từ tiếp theo" ${position >= size - 1 ? 'disabled' : ''}>${icon('right')}</button>
  </div>`;
}

export function japanese(word: Word): string {
  return `<span class="jp-word" lang="ja">${escapeHtml(word.display || word.kanji || word.kana)}</span>
    ${word.kanji || word.displayKana ? `<span class="kana" lang="ja">${escapeHtml(word.displayKana || word.kana)}</span>` : ''}
    ${word.hanViet ? `<span class="word-hanviet">${escapeHtml(word.hanViet)}</span>` : ''}`;
}
