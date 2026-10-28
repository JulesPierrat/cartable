import { addRecord, dailyStreaks, gameStats, type GameRecord } from '@/platform/records';
import { createStore, type StorageBackend } from '@/platform/storage';

function memoryBackend(initial: Record<string, string> = {}): StorageBackend & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getAllKeys: async () => Object.keys(data),
    multiGet: async (keys) => keys.map((key) => [key, data[key] ?? null] as const),
    setItem: async (key, value) => {
      data[key] = value;
    },
    removeItem: async (key) => {
      delete data[key];
    },
  };
}

const daily = (dateKey: string, won = true): GameRecord => ({
  id: `daily-${dateKey}`,
  gameId: 'jusqua-la-mer',
  mode: 'daily',
  dateKey,
  won,
  score: won ? 100 : 0,
  livesLost: won ? 0 : 3,
  durationMs: 60_000,
});

describe('stockage', () => {
  it("charge les valeurs de l'app au démarrage, sans celles des autres apps ni les valeurs illisibles", async () => {
    const backend = memoryBackend({ 'cartable:a': '1', 'cartable:b': '{oups', autre: '2' });
    const store = createStore(backend);
    await store.load();
    expect(store.get('a')).toBe(1);
    expect(store.get('b')).toBeUndefined();
    expect(store.keys()).toEqual(['a']);
  });

  it('écrit en mémoire tout de suite et sur le téléphone en arrière-plan', async () => {
    const backend = memoryBackend();
    const store = createStore(backend);
    const versions: number[] = [];
    store.subscribe(() => versions.push(store.version()));
    store.set('rules-seen', true);
    expect(store.get('rules-seen')).toBe(true);
    await Promise.resolve();
    expect(backend.data['cartable:rules-seen']).toBe('true');
    store.remove('rules-seen');
    expect(store.get('rules-seen')).toBeUndefined();
    expect(versions).toEqual([1, 2]);
  });

  it("n'enregistre qu'une fois la même partie", () => {
    const store = createStore(memoryBackend());
    addRecord(daily('2026-10-28'), store);
    addRecord(daily('2026-10-28'), store);
    expect(store.get<GameRecord[]>('records')).toHaveLength(1);
  });
});

describe('série de jours', () => {
  it('compte les défis réussis d’affilée jusqu’à aujourd’hui', () => {
    const records = ['2026-10-26', '2026-10-27', '2026-10-28'].map((d) => daily(d));
    expect(dailyStreaks(records, '2026-10-28')).toEqual({ current: 3, best: 3 });
  });

  it('reste en vie tant que le défi du jour n’est pas joué, et se perd au premier jour manqué', () => {
    const records = ['2026-10-26', '2026-10-27'].map((d) => daily(d));
    expect(dailyStreaks(records, '2026-10-28').current).toBe(2);
    expect(dailyStreaks(records, '2026-10-29').current).toBe(0);
  });

  it('repart de zéro après un défi perdu, et garde la meilleure série', () => {
    const records = [
      daily('2026-10-20'),
      daily('2026-10-21'),
      daily('2026-10-22'),
      daily('2026-10-23', false),
      daily('2026-10-24'),
    ];
    expect(dailyStreaks(records, '2026-10-24')).toEqual({ current: 1, best: 3 });
  });

  it('ignore les parties libres', () => {
    const free = { ...daily('2026-10-28'), id: 'free', mode: 'medium' };
    expect(dailyStreaks([free], '2026-10-28')).toEqual({ current: 0, best: 0 });
  });
});

describe('stats', () => {
  it('compte les parties, le taux de réussite et les vies perdues', () => {
    const records = [
      daily('2026-10-26'),
      { ...daily('2026-10-27'), livesLost: 1 },
      { ...daily('2026-10-28'), livesLost: 1 },
      daily('2026-10-29', false),
    ];
    expect(gameStats(records)).toEqual({ played: 4, won: 3, winRate: 75, wonByLivesLost: [1, 2, 0], lost: 1 });
  });
});
