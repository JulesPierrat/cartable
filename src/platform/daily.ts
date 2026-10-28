/** Date du jour au format AAAA-MM-JJ, dans le fuseau du téléphone : le défi change à minuit, heure locale. */
export function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Nombre de jours entre deux dates AAAA-MM-JJ (négatif si `to` précède `from`). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Générateur pseudo-aléatoire déterministe (mulberry32) : même graine, même suite, sur tous les téléphones. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Élément du jour numéro `day` (0 = premier jour) : chaque élément sort une fois avant qu'un
 * élément ne revienne, et chaque cycle a son propre ordre.
 */
export function pickForDay<T>(items: readonly T[], day: number, seed: number): T {
  if (items.length === 0) {
    throw new Error('Aucun élément à tirer');
  }
  const cycle = Math.floor(day / items.length);
  const position = day - cycle * items.length;
  return shuffle(items, seededRandom(seed + cycle))[position];
}
