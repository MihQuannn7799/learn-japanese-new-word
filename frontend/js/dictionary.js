import { normalizeKana } from './lib/kana.js';

const datasets = new Map();

function dataset(name) {
  if (!datasets.has(name)) {
    const pending = fetch(new URL(`../data/${name}.json`, import.meta.url)).then((response) => {
      if (!response.ok) throw new Error('Không tải được dữ liệu từ vựng.');
      return response.json();
    }).catch((error) => {
      datasets.delete(name);
      throw error;
    });
    datasets.set(name, pending);
  }
  return datasets.get(name);
}

export const loadN5 = () => dataset('n5');

export function kanjiCandidates(index, kana) {
  const key = normalizeKana(kana);
  return Object.hasOwn(index, key) ? index[key] : [];
}

export async function findKanji(kana) {
  return kanjiCandidates(await dataset('kanji'), kana);
}

export function spellingKey({ kana, kanji }) {
  return JSON.stringify([normalizeKana(kana), kanji.normalize('NFKC')]);
}

export function newCatalogWords(catalog, existing) {
  const keys = new Set(existing.map(spellingKey));
  const ids = new Set(existing.map(({ id }) => id));
  return catalog.filter((word) => {
    const key = spellingKey(word);
    if (keys.has(key) || ids.has(word.id)) return false;
    keys.add(key);
    ids.add(word.id);
    return true;
  });
}
