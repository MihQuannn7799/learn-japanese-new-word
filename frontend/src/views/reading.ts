import { escapeHtml, icon, speedPanel, stepper } from './shared.ts';
import type { StudyState, Word } from '../types.ts';

export function readingWord(word: Word): string {
  return `<span class="badge" id="reading-status" aria-live="polite">SẴN SÀNG</span>
    <button class="word-pronunciation jp-word" type="button" data-action="speak" lang="ja" title="Nghe phát âm">${escapeHtml(word.kanji || word.kana)}</button>
    ${word.kanji ? `<span class="kana reading-kana" lang="ja">${escapeHtml(word.kana)}</span>` : ''}
    <p class="reading-meaning" lang="${word.meaningLanguage === 'en' ? 'en' : 'vi'}">${escapeHtml(word.meaning)}</p>
    ${word.example ? `<div class="reading-example">
      <p lang="ja">${escapeHtml(word.example)}</p>
      ${word.exampleMeaning ? `<p class="reading-meaning muted">${escapeHtml(word.exampleMeaning)}</p>` : ''}
    </div>` : ''}`;
}

export function readingView(state: StudyState, word: Word): string {
  const { words, readingIndex, showKana, showMeaning } = state;
  return `<div class="study-grid reading-layout${showKana ? '' : ' hide-kana'}${showMeaning ? '' : ' hide-meaning'}">
    <section class="study-card" aria-label="Trình đọc từ vựng">
      <div class="exercise-listen reading" id="reading-word">${readingWord(word)}</div>
      <div class="exercise-body">
        <div class="reading-actions">
          <button class="btn primary" data-action="play-list" data-label="Tự đọc từ">${icon('play')} Tự đọc từ</button>
          <button class="btn secondary" data-action="play-list" data-example data-label="Tự đọc từ + câu">${icon('play')} Tự đọc từ + câu</button>
          <button class="btn secondary" data-action="speak-example" ${word.example ? '' : 'hidden'}>${icon('volume')} Nghe câu</button>
        </div>
        <div class="card-controls" id="reading-stepper">${stepper(readingIndex, words.length)}</div>
      </div>
    </section>
    <aside class="side-stack">
      ${speedPanel(state)}
      <section class="panel">
        <h3 class="panel-title">${icon('book')} Danh sách đọc</h3>
        <div class="reading-options">
          <label><input type="checkbox" id="show-kana" ${showKana ? 'checked' : ''}> Cách đọc</label>
          <label><input type="checkbox" id="show-meaning" ${showMeaning ? 'checked' : ''}> Nghĩa</label>
        </div>
        <ol class="playlist">
          ${words.map((item, index) => `<li><button data-action="choose-word" data-index="${index}" aria-current="${index === readingIndex}"><span class="position">${index + 1}</span><span lang="ja">${escapeHtml(item.kanji || item.kana)}</span>${item.kanji ? `<span class="reading-kana muted" lang="ja">${escapeHtml(item.kana)}</span>` : ''}<span class="reading-meaning muted">${escapeHtml(item.meaning)}</span></button></li>`).join('')}
        </ol>
      </section>
    </aside>
  </div>`;
}
