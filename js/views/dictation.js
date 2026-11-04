import { escapeHtml, icon, progressPanel, speedPanel } from './shared.js';

export function dictationFeedback(word, feedback) {
  if (feedback === 'incorrect') return 'Chưa khớp. Nghe lại rồi thử thêm một lần nhé.';
  if (!feedback) return '';
  const answer = `${escapeHtml(word.kana)}${word.kanji ? ` · ${escapeHtml(word.kanji)}` : ''}`;
  return `${feedback === 'correct' ? 'Chính xác!' : 'Đáp án'} <strong lang="ja">${answer}</strong> · ${escapeHtml(word.meaning)}`;
}

function dictationRow(word, index, draft) {
  const number = index + 1;
  return `<li class="dictation-row" id="dictation-row-${index}">
    <form class="dictation-form" data-index="${index}">
      <span class="dictation-number" aria-hidden="true">${String(number).padStart(2, '0')}</span>
      <button class="btn icon-only secondary dictation-listen" type="button" data-action="listen-row" aria-label="Nghe từ ${number}" aria-pressed="false" title="Nghe hoặc dừng từ ${number}">
        <span class="listen-icon">${icon('volume')}</span><span class="stop-icon">${icon('stop')}</span>
      </button>
      <input class="dictation-answer" name="answer" aria-label="Câu trả lời từ ${number}" aria-describedby="dictation-feedback-${index}" lang="ja" maxlength="120" value="${escapeHtml(draft?.answer ?? '')}" placeholder="Nhập từ nghe được" autocomplete="off" autocapitalize="off" spellcheck="false" required>
      <div class="dictation-actions">
        <button class="btn subtle" type="submit" aria-label="Kiểm tra từ ${number}">Kiểm tra</button>
        <button class="btn plain" type="button" data-action="reveal" aria-label="Xem đáp án từ ${number}">Đáp án</button>
      </div>
      <div id="dictation-feedback-${index}" class="feedback dictation-feedback${draft?.feedback === 'incorrect' ? ' incorrect' : ''}" role="status">${dictationFeedback(word, draft?.feedback)}</div>
    </form>
  </li>`;
}

export function dictationView(state) {
  const { words, dictationDrafts, speed, repeats } = state;
  return `<div class="study-grid dictation-layout">
    <section class="study-card dictation-card" aria-label="Bài nghe chép">
      <div class="dictation-intro">
        <div>
          <h3>Bài nghe · ${words.length} từ</h3>
          <p class="muted">Nghe lần lượt từ trên xuống hoặc phát lại một dòng bất kỳ.</p>
        </div>
        <button class="btn primary" data-action="play-list">${icon('play')} Nghe cả danh sách</button>
        <p id="dictation-status" class="muted" role="status">Sẵn sàng</p>
      </div>
      <ol class="dictation-list" aria-label="Danh sách từ nghe chép" role="list">
        ${words.map((word, index) => dictationRow(word, index, dictationDrafts.get(word.id))).join('')}
      </ol>
    </section>
    <aside class="side-stack dictation-sidebar">
      ${speedPanel(speed, repeats)}
      <div id="dictation-progress">${progressPanel(state, true)}</div>
    </aside>
  </div>`;
}
