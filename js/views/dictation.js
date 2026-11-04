import { escapeHtml, icon, progressPanel, speedPanel, stepper } from './shared.js';

export function dictationView({ words, feedback, dictationInput, dictationIndex, speed, correctAnswers }, word) {
  const answer = `${escapeHtml(word.kana)}${word.kanji ? ` · ${escapeHtml(word.kanji)}` : ''}`;
  const result = {
    correct: `Chính xác! <strong lang="ja">${answer}</strong> · ${escapeHtml(word.meaning)}`,
    incorrect: 'Chưa khớp. Nghe lại và thử thêm một lần nhé.',
    revealed: `Đáp án <strong lang="ja">${answer}</strong> · ${escapeHtml(word.meaning)}`,
  }[feedback] ?? '';
  return `<div class="study-grid">
    <section class="study-card" aria-label="Bài nghe chép">
      <div class="exercise-listen">
        <button class="round-play" data-action="speak" aria-label="Nghe từ tiếng Nhật">${icon('volume')}</button>
        <h3>Nghe từ tiếng Nhật</h3>
        <p class="muted">Bạn có thể phát lại bao nhiêu lần tùy ý.</p>
      </div>
      <div class="exercise-body">
        <form id="dictation-form" class="dictation-form">
          <label class="field">Câu trả lời<input id="dictation-input" name="answer" lang="ja" maxlength="120" value="${escapeHtml(dictationInput)}" placeholder="Gõ hiragana, katakana hoặc kanji" autocomplete="off" autocapitalize="off" spellcheck="false" required></label>
          <div id="dictation-feedback" class="${feedback === 'incorrect' ? 'feedback incorrect' : 'feedback'}" role="status" ${result ? '' : 'hidden'}>${result}</div>
          <div class="inline-actions">
            <button class="btn primary" type="submit">${icon('check')} Kiểm tra</button>
            <button class="btn secondary" type="button" data-action="reveal">Xem đáp án</button>
          </div>
        </form>
        <div class="card-controls">${stepper(dictationIndex, words.length)}</div>
      </div>
    </section>
    <aside class="side-stack">${speedPanel(speed)}${progressPanel({ words, correctAnswers }, true)}</aside>
  </div>`;
}
