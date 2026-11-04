import { starterWords } from './data/starter-words.ts';
import type { SavedNotebook, StudyState, Word } from './types.ts';
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

  return {
    words, known, speed, repeats,
    wordGap: typeof saved.wordGap === 'number' && wordGaps.includes(saved.wordGap) ? saved.wordGap : 500,
    showKana: saved.showKana !== false,
    showMeaning: saved.showMeaning !== false,
    mode: 'flash',
    flashOrder: words.map((word) => word.id),
    flashIndex: 0,
    flipped: false,
    dictationIndex: 0,
    dictationDrafts: new Map(),
    correctAnswers: new Set(),
    readingIndex: 0,
    search: '',
    vocabularyLayout: 'cards',
  };
}

export function wordById(state: StudyState, id: string): Word | undefined {
  return state.words.find((word) => word.id === id);
}

export function currentWord(state: StudyState): Word | undefined {
  if (state.mode === 'flash') return wordById(state, state.flashOrder[state.flashIndex]);
  if (state.mode === 'dictation') return state.words[state.dictationIndex];
  return state.words[state.readingIndex];
}

export function resetStudyPositions(state: StudyState): void {
  state.flashOrder = state.words.map((word) => word.id);
  state.flashIndex = 0;
  state.flipped = false;
  state.dictationIndex = 0;
  state.readingIndex = 0;
  state.search = '';
}
