import assert from 'node:assert/strict';
import test from 'node:test';
import { createState } from '../frontend/src/state.ts';
import { vocabularyView, rowsView } from '../frontend/src/views/vocabulary.ts';

test('renders Japanese, reading, Han Viet, Vietnamese meaning and examples in both layouts', () => {
  const word = { id: 'sample', kana: 'ほん', kanji: '本', meaning: 'sách', meaningLanguage: 'vi', hanViet: 'BẢN', example: '本を読みます。', exampleMeaning: 'Tôi đọc sách.', lesson: 2 };
  const state = createState({ words: [word] });
  const cards = vocabularyView(state);
  assert.match(cards, /word-card-japanese/);
  assert.match(cards, /lang="vi">sách/);
  assert.match(cards, /BẢN/);
  assert.match(cards, /Tôi đọc sách/);
  state.search = 'ban';
  assert.match(rowsView(state), /word-card-japanese/);
  state.vocabularyLayout = 'list';
  assert.match(vocabularyView(state), /<table/);
  assert.match(rowsView(state), /lang="vi">sách/);
});

test('escapes text from cards, readings and examples before rendering', () => {
  const text = '<img src=x onerror=alert(1)>';
  const state = createState({ words: [{ id: 'safe', kana: 'ほん', kanji: '本', meaning: text, display: text, displayKana: text, hanViet: text, example: text, exampleMeaning: text }] });
  for (const layout of ['cards', 'list']) {
    state.vocabularyLayout = layout;
    const html = vocabularyView(state);
    assert.ok(!html.includes('<img'));
    assert.match(html, /&lt;img/);
  }
});
