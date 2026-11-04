export interface WordFields {
  kana: string;
  meaning: string;
  kanji: string;
  meaningLanguage?: 'vi' | 'en';
  example?: string;
  exampleMeaning?: string;
}

export interface Word extends WordFields {
  id: string;
}

export interface StudySettings {
  speed: number;
  repeats: number;
  wordGap: number;
  showKana: boolean;
  showMeaning: boolean;
}

export interface Notebook extends StudySettings {
  words: Word[];
  known: string[];
}

export type SavedNotebook = Partial<Notebook>;

export interface NotebookEnvelope {
  revision: number;
  notebook: Notebook | null;
}

export interface NotebookUpdate {
  revision: number | null;
  notebook: Notebook;
}
