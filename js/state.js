import { starterWords } from './data/starter-words.js';

export function createState(saved) {
  const words = Array.isArray(saved.words) ? saved.words : [...starterWords];
  const known = new Set(Array.isArray(saved.known) ? saved.known : []);
  const speed = typeof saved.speed === 'number' && saved.speed >= 0.5 && saved.speed <= 1.5
    ? saved.speed : 0.85;

  return {
    words, known, speed,
    mode: 'flash',
    flashOrder: words.map((word) => word.id),
    flashIndex: 0,
    flipped: false,
    dictationIndex: 0,
    dictationInput: '',
    feedback: '',
    correctAnswers: new Set(),
    readingIndex: 0,
    search: '',
  };
}

export function wordById(state, id) {
  return state.words.find((word) => word.id === id);
}

export function currentWord(state) {
  if (state.mode === 'flash') return wordById(state, state.flashOrder[state.flashIndex]);
  if (state.mode === 'dictation') return state.words[state.dictationIndex];
  return state.words[state.readingIndex];
}

export function resetDictation(state) {
  state.dictationInput = '';
  state.feedback = '';
}

export function resetStudyPositions(state) {
  state.flashOrder = state.words.map((word) => word.id);
  state.flashIndex = 0;
  state.flipped = false;
  state.dictationIndex = 0;
  resetDictation(state);
  state.readingIndex = 0;
  state.search = '';
}
