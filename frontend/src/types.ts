import type { StudySettings, Word } from '../../shared/notebook.ts';

export type { Notebook, SavedNotebook, Word, WordFields } from '../../shared/notebook.ts';
export type StudyMode = 'flash' | 'dictation' | 'reading' | 'words';
export type Feedback = '' | 'correct' | 'incorrect' | 'revealed';
export type VocabularyLayout = 'cards' | 'list';

export interface DictationDraft {
  answer: string;
  feedback: Feedback;
}

export interface StudyState extends StudySettings {
  words: Word[];
  known: Set<string>;
  mode: StudyMode;
  flashOrder: string[];
  flashIndex: number;
  flipped: boolean;
  dictationIndex: number;
  dictationDrafts: Map<string, DictationDraft>;
  correctAnswers: Set<string>;
  readingIndex: number;
  search: string;
  vocabularyLayout: VocabularyLayout;
}

export interface Lesson {
  number: number;
  title: string;
  wordIds: string[];
}

export interface KanjiCandidate {
  kanji: string;
  meaning: string;
  level: string;
}

export interface DialogOptions {
  state: StudyState;
  notify: (message: string) => void;
  onChange: () => void;
}
