import { normalizeKana } from '../../shared/kana.ts';
import type { KanjiCandidate, Lesson, Word, WordFields } from './types.ts';
import type { LegacyMeaningUpgrade } from '../../shared/legacy.ts';

interface Datasets {
  'minna-vi': Word[];
  'minna-lessons': Lesson[];
  'kanji-vi': Record<string, KanjiCandidate[]>;
  'legacy-n5-vi': LegacyMeaningUpgrade[];
}
const datasets = new Map<keyof Datasets, Promise<unknown>>();

function dataset<K extends keyof Datasets>(name: K): Promise<Datasets[K]> {
  if (!datasets.has(name)) {
    const pending = fetch(new URL(`./data/${name}.json`, document.baseURI)).then((response) => {
      if (!response.ok) throw new Error('Không tải được dữ liệu từ vựng.');
      return response.json();
    }).catch((error) => {
      datasets.delete(name);
      throw error;
    });
    datasets.set(name, pending);
  }
  return datasets.get(name) as Promise<Datasets[K]>;
}

export const loadMinna = () => dataset('minna-vi');
export const loadMinnaLessons = () => dataset('minna-lessons');
export const loadLegacyMeanings = () => dataset('legacy-n5-vi');

export function wordsInLesson(catalog: Word[], lesson?: Lesson): Word[] {
  if (!lesson) return catalog;
  const ids = new Set(lesson.wordIds);
  return catalog.filter(({ id }) => ids.has(id));
}

export function kanjiCandidates(index: Datasets['kanji-vi'], kana: string): KanjiCandidate[] {
  const key = normalizeKana(kana);
  return Object.hasOwn(index, key) ? index[key] : [];
}

export async function findKanji(kana: string): Promise<KanjiCandidate[]> {
  return kanjiCandidates(await dataset('kanji-vi'), kana);
}

export function spellingKey({ kana, kanji }: Pick<WordFields, 'kana' | 'kanji'>): string {
  return JSON.stringify([normalizeKana(kana), kanji.normalize('NFKC')]);
}

export function newCatalogWords(catalog: Word[], existing: Word[]): Word[] {
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
