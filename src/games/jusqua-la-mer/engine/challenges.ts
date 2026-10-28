import type { Difficulty, River, RiverDataset } from '@/games/jusqua-la-mer/data/rivers';
import { daysBetween, pickForDay } from '@/platform/daily';

/** Premier défi du jour (n°1). */
export const DAILY_EPOCH = '2026-10-28';
/** Graine du tirage : la changer rebat tous les défis du jour. */
const DAILY_SEED = 20261028;

/**
 * Rivières du défi du jour : niveaux facile et moyen, avec au moins une étape à citer
 * (« la Seine → Manche » est trop court pour un défi). Les difficiles restent en partie libre.
 */
export function dailyPool(dataset: RiverDataset): River[] {
  return dataset.rivers
    .filter((river) => river.difficulty !== 'hard' && river.steps.some((step) => !step.optional))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

export type DailyChallenge = { number: number; river: River };

/** Défi du jour pour une date AAAA-MM-JJ : le même pour tout le monde, sans répétition avant d'avoir tout vu. */
export function dailyChallenge(dataset: RiverDataset, dateKey: string): DailyChallenge {
  const day = daysBetween(DAILY_EPOCH, dateKey);
  return { number: day + 1, river: pickForDay(dailyPool(dataset), day, DAILY_SEED) };
}

/** Rivière au hasard pour la partie libre, en évitant si possible celles qu'on vient de jouer. */
export function randomRiver(
  dataset: RiverDataset,
  difficulty: Difficulty,
  random: () => number = Math.random,
  recentIds: readonly string[] = [],
): River {
  const level = dataset.rivers.filter((river) => river.difficulty === difficulty);
  const fresh = level.filter((river) => !recentIds.includes(river.id));
  const pool = fresh.length > 0 ? fresh : level;
  return pool[Math.floor(random() * pool.length)];
}
