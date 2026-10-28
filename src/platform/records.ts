import { daysBetween } from '@/platform/daily';
import { storage, useStored, type Store } from '@/platform/storage';

/** Une partie terminée, pour les stats et la série de jours. Commun à tous les mini-jeux. */
export type GameRecord = {
  /** Unique par partie : enregistrer deux fois la même partie ne la compte qu'une fois. */
  id: string;
  gameId: string;
  /** `daily` pour le défi du jour, sinon le niveau de la partie libre. */
  mode: string;
  /** Date locale AAAA-MM-JJ de la partie. */
  dateKey: string;
  dailyNumber?: number;
  won: boolean;
  score: number;
  livesLost: number;
  durationMs: number;
};

const RECORDS_KEY = 'records';

export function addRecord(record: GameRecord, store: Store = storage): void {
  const records = store.get<GameRecord[]>(RECORDS_KEY) ?? [];
  if (!records.some((existing) => existing.id === record.id)) {
    store.set(RECORDS_KEY, [...records, record]);
  }
}

export function useRecords(gameId: string): GameRecord[] {
  return (useStored<GameRecord[]>(RECORDS_KEY) ?? []).filter((record) => record.gameId === gameId);
}

export type Streaks = { current: number; best: number };

/**
 * Série de défis du jour réussis d'affilée. La série en cours compte jusqu'à aujourd'hui, ou
 * jusqu'à hier si le défi du jour n'est pas encore joué : elle ne se perd qu'au premier jour manqué.
 */
export function dailyStreaks(records: readonly GameRecord[], today: string): Streaks {
  const wonDays = [...new Set(records.filter((r) => r.mode === 'daily' && r.won).map((r) => r.dateKey))].sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < wonDays.length; i++) {
    run = i > 0 && daysBetween(wonDays[i - 1], wonDays[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const last = wonDays.at(-1);
  const gap = last === undefined ? Infinity : daysBetween(last, today);
  return { current: gap <= 1 ? run : 0, best };
}

export type GameStats = {
  played: number;
  won: number;
  /** Pourcentage de parties gagnées, arrondi. */
  winRate: number;
  /** Parties gagnées sans perdre de vie, avec une vie perdue, avec deux… */
  wonByLivesLost: number[];
  lost: number;
};

export function gameStats(records: readonly GameRecord[], maxLivesLost = 2): GameStats {
  const won = records.filter((r) => r.won);
  const wonByLivesLost = Array.from({ length: maxLivesLost + 1 }, (_, n) => won.filter((r) => r.livesLost === n).length);
  return {
    played: records.length,
    won: won.length,
    winRate: records.length > 0 ? Math.round((100 * won.length) / records.length) : 0,
    wonByLivesLost,
    lost: records.length - won.length,
  };
}
