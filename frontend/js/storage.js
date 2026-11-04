const storageKey = 'kotoba.notebook.v1';

export function loadNotebook() {
  try {
    return { saved: JSON.parse(localStorage.getItem(storageKey)) ?? {}, available: true };
  } catch {
    return { saved: {}, available: false };
  }
}

export function notebookSnapshot({ words, known, speed, repeats, wordGap, showKana, showMeaning }) {
  return { words, known: [...known], speed, repeats, wordGap, showKana, showMeaning };
}

export function storeNotebook(state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(notebookSnapshot(state)));
    return true;
  } catch {
    return false;
  }
}
