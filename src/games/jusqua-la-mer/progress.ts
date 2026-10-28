import { dataset } from '@/games/jusqua-la-mer/data/rivers';
import { dailyChallenge } from '@/games/jusqua-la-mer/engine/challenges';
import { mistakeCount, score, startGame, type GameState } from '@/games/jusqua-la-mer/engine/game';
import { setupGame, type GameMode, type GameSetup } from '@/games/jusqua-la-mer/presentation';
import { localDateKey } from '@/platform/daily';
import type { FinishedGame } from '@/games/jusqua-la-mer/session';
import { addRecord, type GameRecord } from '@/platform/records';
import { storage, useStored, type Store } from '@/platform/storage';

export const GAME_ID = 'jusqua-la-mer';
const RULES_SEEN_KEY = `${GAME_ID}:rules-seen`;
const DAILY_PREFIX = `${GAME_ID}:daily:`;

/** Le défi du jour en cours ou terminé : il reprend où on l'a laissé, et ne se rejoue pas. */
export type DailySave = {
  dateKey: string;
  number: number;
  riverId: string;
  state: GameState;
  startedAt: number;
  finishedAt?: number;
};

/** Une sauvegarde ne vaut que si elle porte sur la rivière du jour (les données ont pu changer depuis). */
function validDaily(save: DailySave | undefined, dateKey: string): DailySave | undefined {
  return save && save.riverId === dailyChallenge(dataset, dateKey).river.id ? save : undefined;
}

export function loadDaily(dateKey: string, store: Store = storage): DailySave | undefined {
  return validDaily(store.get<DailySave>(DAILY_PREFIX + dateKey), dateKey);
}

export function useDailySave(dateKey: string): DailySave | undefined {
  return validDaily(useStored<DailySave>(DAILY_PREFIX + dateKey), dateKey);
}

/** Enregistre le défi du jour, et oublie ceux des jours précédents. */
export function saveDaily(save: DailySave, store: Store = storage): void {
  for (const key of store.keys()) {
    if (key.startsWith(DAILY_PREFIX) && key !== DAILY_PREFIX + save.dateKey) {
      store.remove(key);
    }
  }
  store.set(DAILY_PREFIX + save.dateKey, save);
}

export function finishedDailyGame(save: DailySave): FinishedGame | null {
  if (save.finishedAt === undefined) {
    return null;
  }
  const setup: GameSetup = { mode: 'daily', river: save.state.river, dailyNumber: save.number };
  return { setup, state: save.state, durationMs: save.finishedAt - save.startedAt };
}

export type GameStart = {
  setup: GameSetup;
  state: GameState;
  startedAt: number;
  dateKey: string;
  /** Le défi du jour est déjà terminé : il ne se rejoue pas, on montre son résultat. */
  finished: FinishedGame | null;
};

/** Nouvelle partie, ou reprise du défi du jour là où on l'a laissé. */
export function startOrResume(mode: GameMode, now: Date): GameStart {
  const dateKey = localDateKey(now);
  const setup = setupGame(mode, now);
  const save = mode === 'daily' ? loadDaily(dateKey) : undefined;
  if (save) {
    return { setup, state: save.state, startedAt: save.startedAt, dateKey, finished: finishedDailyGame(save) };
  }
  return { setup, state: startGame(setup.river), startedAt: now.getTime(), dateKey, finished: null };
}

/** Ajoute une partie terminée à l'historique (stats et série de jours). */
export function recordGame(setup: GameSetup, state: GameState, startedAt: number, finishedAt: number, dateKey: string): void {
  const record: GameRecord = {
    id: `${GAME_ID}:${setup.mode}:${startedAt}`,
    gameId: GAME_ID,
    mode: setup.mode,
    dateKey,
    dailyNumber: setup.dailyNumber,
    won: state.status === 'won',
    score: score(state),
    livesLost: state.history.filter((entry) => entry.kind === 'hint').length + mistakeCount(state),
    durationMs: finishedAt - startedAt,
  };
  addRecord(record);
}

export function useRulesSeen(): boolean {
  return useStored<boolean>(RULES_SEEN_KEY) === true;
}

export function markRulesSeen(): void {
  storage.set(RULES_SEEN_KEY, true);
}
