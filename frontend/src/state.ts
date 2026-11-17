import { starterWords } from './data/starter-words.ts';
import type { FlashFilter, SavedNotebook, StudyState, Word } from './types.ts';
import { wordGaps } from '../../shared/settings.ts';

export function createState(saved: SavedNotebook): StudyState {
  const words = Array.isArray(saved.words) ? saved.words.map((word) => {
    if (Object.hasOwn(word, 'example')) return word;
    const sample = starterWords.find((item) =>
      item.id === word.id && item.kana === word.kana && item.kanji === word.kanji && item.meaning === word.meaning);
    return sample ? { ...word, example: sample.example, exampleMeaning: sample.exampleMeaning } : word;
  }) : [...starterWords];
  const known = new Set(Array.isArray(saved.known) ? saved.known : []);
  const speed = typeof saved.speed === 'number' && saved.speed >= 0.5 && saved.speed <= 1.5
    ? saved.speed : 1;

  const repeats = typeof saved.repeats === 'number' && Number.isInteger(saved.repeats) && saved.repeats >= 1 && saved.repeats <= 5
    ? saved.repeats : 1;

  const state: StudyState = {
    words, known, speed, repeats,
    wordGap: typeof saved.wordGap === 'number' && wordGaps.includes(saved.wordGap) ? saved.wordGap : 500,
    showKana: saved.showKana !== false,
    showMeaning: saved.showMeaning !== false,
    mode: 'flash',
    flashFilter: 'random',
    flashOrder: [],
    flashIndex: 0,
    flipped: false,
    dictationIndex: 0,
    dictationDrafts: new Map(),
    correctAnswers: new Set(),
    readingIndex: 0,
    search: '',
    vocabularyLayout: 'cards',
  };
  startFlashSession(state);
  return state;
}

export function wordById(state: StudyState, id: string): Word | undefined {
  return state.words.find((word) => word.id === id);
}

export function currentWord(state: StudyState): Word | undefined {
  if (state.mode === 'flash') return wordById(state, state.flashOrder[state.flashIndex]);
  if (state.mode === 'dictation') return state.words[state.dictationIndex];
  return state.words[state.readingIndex];
}

export function startFlashSession(state: StudyState, filter: FlashFilter = state.flashFilter): void {
  const order = state.words
    .filter(({ id }) => filter === 'random' || state.known.has(id) === (filter === 'known'))
    .map(({ id }) => id);
  if (filter === 'random') {
    for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [order[index], order[other]] = [order[other], order[index]];
    }
  }
  state.flashFilter = filter;
  state.flashOrder = order;
  state.flashIndex = 0;
  state.flipped = false;
}

export function flashProgress({ flashOrder, known }: StudyState) {
  const total = flashOrder.length;
  let remembered = 0;
  for (const id of flashOrder) {
    if (known.has(id)) remembered++;
  }
  return { remembered, total, percent: total ? Math.round(remembered * 100 / total) : 0 };
}

export function resetStudyPositions(state: StudyState): void {
  startFlashSession(state);
  state.dictationIndex = 0;
  state.readingIndex = 0;
  state.search = '';
}
