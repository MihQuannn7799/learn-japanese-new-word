import type { Notebook, SavedNotebook, StudyState } from './types.ts';

const storageKey = 'kotoba.notebook.v1';

export function loadNotebook(): { saved: SavedNotebook; available: boolean } {
  try {
    return { saved: JSON.parse(localStorage.getItem(storageKey) ?? 'null') ?? {}, available: true };
  } catch {
    return { saved: {}, available: false };
  }
}

export function notebookSnapshot({ words, known, speed, repeats, wordGap, showKana, showMeaning }: StudyState): Notebook {
  return { words, known: [...known], speed, repeats, wordGap, showKana, showMeaning };
}

export function storeNotebook(state: StudyState): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify(notebookSnapshot(state)));
    return true;
  } catch {
    return false;
  }
}
