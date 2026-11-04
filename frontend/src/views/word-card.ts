import type { Word } from '../types.ts';
import { escapeHtml, icon } from './shared.ts';

interface CardOptions {
  position: number;
  actionsHtml: string;
  speakAction?: string;
  exampleAction?: string;
  known?: boolean;
}

export function wordCard(word: Word, { position, actionsHtml, speakAction = 'speak', exampleAction = 'speak-example', known }: CardOptions): string {
  const written = word.display || word.kanji || word.kana;
  const reading = word.displayKana || word.kana;
  return `<li class="word-card">
    <div class="word-card-head">
      <div class="word-card-lexeme">
        <span class="word-card-number">${String(position).padStart(2, '0')}${word.lesson ? ` · Bài ${escapeHtml(word.lesson)}` : ''}</span>
        <strong class="word-card-japanese" lang="ja">${escapeHtml(written)}</strong>
        ${written !== reading ? `<span class="word-card-reading" lang="ja">${escapeHtml(reading)}</span>` : ''}
        ${word.hanViet ? `<span class="word-hanviet">${escapeHtml(word.hanViet)}</span>` : ''}
      </div>
      <button class="btn plain icon-only" type="button" data-action="${speakAction}" data-id="${escapeHtml(word.id)}" aria-label="Nghe ${escapeHtml(word.kana)}" title="Nghe từ">${icon('volume')}</button>
    </div>
    <p class="word-card-meaning" lang="${word.meaningLanguage === 'en' ? 'en' : 'vi'}">${escapeHtml(word.meaning)}</p>
    ${word.example ? `<div class="word-card-example">
      <div><p lang="ja">${escapeHtml(word.example)}</p>${word.exampleMeaning ? `<p class="muted" lang="vi">${escapeHtml(word.exampleMeaning)}</p>` : ''}</div>
      <button class="btn plain icon-only" type="button" data-action="${exampleAction}" data-id="${escapeHtml(word.id)}" aria-label="Nghe câu ví dụ" title="Nghe câu">${icon('volume')}</button>
    </div>` : ''}
    <div class="word-card-footer">${known ? '<span class="badge known">Đã nhớ</span>' : '<span></span>'}<div class="inline-actions">${actionsHtml}</div></div>
  </li>`;
}

export function layoutButtons(action: string, layout: 'cards' | 'list'): string {
  return `<div class="layout-switch" role="group" aria-label="Cách trình bày từ vựng">
    <button class="btn secondary" type="button" data-action="${action}" data-layout="list" aria-pressed="${layout === 'list'}">Danh sách</button>
    <button class="btn secondary" type="button" data-action="${action}" data-layout="cards" aria-pressed="${layout === 'cards'}">Thẻ từ</button>
  </div>`;
}
