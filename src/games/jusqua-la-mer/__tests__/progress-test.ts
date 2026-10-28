import { dataset } from '@/games/jusqua-la-mer/data/rivers';
import { dailyChallenge } from '@/games/jusqua-la-mer/engine/challenges';
import { answerWatercourse, requestHint } from '@/games/jusqua-la-mer/engine/game';
import { gameContext } from '@/games/jusqua-la-mer/presentation';
import { loadDaily, recordGame, saveDaily, startOrResume, type DailySave } from '@/games/jusqua-la-mer/progress';
import type { GameRecord } from '@/platform/records';
import { storage } from '@/platform/storage';

const today = '2026-10-28';
const now = new Date(2026, 9, 28, 9, 0);

function dailySave(dateKey: string, overrides: Partial<DailySave> = {}): DailySave {
  const start = startOrResume('daily', new Date(`${dateKey}T09:00:00`));
  return {
    dateKey,
    number: start.setup.dailyNumber!,
    riverId: start.setup.river.id,
    state: start.state,
    startedAt: start.startedAt,
    ...overrides,
  };
}

describe('progression du défi du jour', () => {
  beforeEach(() => {
    for (const key of storage.keys()) {
      storage.remove(key);
    }
  });

  it('démarre une partie neuve quand rien n’est sauvegardé', () => {
    const start = startOrResume('daily', now);
    expect(start.setup.river.id).toBe(dailyChallenge(dataset, today).river.id);
    expect(start.state.history).toEqual([]);
    expect(start.finished).toBeNull();
  });

  it('reprend le défi là où on l’a laissé', () => {
    const save = dailySave(today);
    const played = answerWatercourse(save.state, 'Marne', gameContext).state;
    saveDaily({ ...save, state: played, startedAt: 123 });
    const start = startOrResume('daily', now);
    expect(start.state.livesLeft).toBe(played.livesLeft);
    expect(start.startedAt).toBe(123);
    expect(start.finished).toBeNull();
  });

  it('ne rejoue pas un défi terminé : il renvoie son résultat', () => {
    const save = dailySave(today, { startedAt: 1_000, finishedAt: 61_000 });
    saveDaily({ ...save, state: { ...save.state, status: 'won' } });
    expect(startOrResume('daily', now).finished?.durationMs).toBe(60_000);
  });

  it('oublie la sauvegarde des jours précédents, et une sauvegarde qui ne correspond pas à la rivière du jour', () => {
    saveDaily(dailySave('2026-10-27'));
    saveDaily(dailySave(today));
    expect(storage.keys()).toEqual([`jusqua-la-mer:daily:${today}`]);
    storage.set(`jusqua-la-mer:daily:${today}`, { ...dailySave(today), riverId: 'Q0' });
    expect(loadDaily(today)).toBeUndefined();
  });

  it('enregistre une partie terminée en comptant les vies perdues sur les erreurs et les indices', () => {
    const start = startOrResume('medium', now);
    let state = requestHint(start.state, gameContext).state;
    state = answerWatercourse(state, 'Ill', gameContext).state;
    recordGame(start.setup, { ...state, status: 'lost' }, 0, 30_000, today);
    const [record] = storage.get<GameRecord[]>('records')!;
    expect(record).toMatchObject({ gameId: 'jusqua-la-mer', mode: 'medium', won: false, durationMs: 30_000 });
    expect(record.livesLost).toBe(3 - state.livesLeft);
  });
});
