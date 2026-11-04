const storageKey = 'kotoba.notebook.v1';

export function loadNotebook() {
  try {
    return { saved: JSON.parse(localStorage.getItem(storageKey)) ?? {}, available: true };
  } catch {
    return { saved: {}, available: false };
  }
}

export function storeNotebook({ words, known, speed, repeats, wordGap, showKana, showMeaning }) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ words, known: [...known], speed, repeats, wordGap, showKana, showMeaning }));
    return true;
  } catch {
    return false;
  }
}
