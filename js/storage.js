const storageKey = 'kotoba.notebook.v1';

export function loadNotebook() {
  try {
    return { saved: JSON.parse(localStorage.getItem(storageKey)) ?? {}, available: true };
  } catch {
    return { saved: {}, available: false };
  }
}

export function storeNotebook({ words, known, speed, repeats }) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ words, known: [...known], speed, repeats }));
    return true;
  } catch {
    return false;
  }
}
