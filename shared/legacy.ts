import type { Word } from './notebook.ts';

export interface LegacyMeaningUpgrade {
  original: Pick<Word, 'id' | 'kana' | 'kanji' | 'meaning'>;
  meaning: string;
}

export function upgradeLegacyMeanings(words: Word[], upgrades: LegacyMeaningUpgrade[]): { words: Word[]; changed: number } {
  const byId = new Map(upgrades.map((upgrade) => [upgrade.original.id, upgrade]));
  let changed = 0;
  const updated = words.map((word) => {
    const upgrade = byId.get(word.id);
    if (!upgrade || word.meaningLanguage !== 'en') return word;
    const { original, meaning } = upgrade;
    if (word.kana !== original.kana || word.kanji !== original.kanji || word.meaning !== original.meaning) return word;
    changed++;
    return { ...word, meaning, meaningLanguage: 'vi' as const };
  });
  return { words: changed ? updated : words, changed };
}
