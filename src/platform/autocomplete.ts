import { normalizeName } from '@/platform/text';

type IndexedName = { name: string; normalized: string; words: string[] };

/** Index de noms pour l'autocomplétion ; l'ordre des noms (du plus au moins connu) est conservé. */
export type NameIndex = readonly IndexedName[];

export function buildNameIndex(names: readonly string[]): NameIndex {
  return names.map((name) => {
    const normalized = normalizeName(name);
    return { name, normalized, words: normalized.split(' ') };
  });
}

/**
 * Suggestions pour une saisie : d'abord les noms qui commencent par la saisie, puis ceux dont
 * un mot commence par elle (« oloron » trouve « Gave d'Oloron »), chaque groupe dans l'ordre de l'index.
 */
export function suggest(index: NameIndex, query: string, limit = 3): string[] {
  const q = normalizeName(query);
  if (!q) {
    return [];
  }
  const starts: string[] = [];
  const inside: string[] = [];
  for (const entry of index) {
    if (entry.normalized.startsWith(q)) {
      starts.push(entry.name);
      if (starts.length === limit) {
        return starts;
      }
    } else if (inside.length < limit && entry.words.some((word) => word.startsWith(q))) {
      inside.push(entry.name);
    }
  }
  return [...starts, ...inside].slice(0, limit);
}
