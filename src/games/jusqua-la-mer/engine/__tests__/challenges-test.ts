import { dataset, watercourseNames } from '@/games/jusqua-la-mer/data/rivers';
import { DAILY_EPOCH, dailyChallenge, dailyPool, randomRiver } from '@/games/jusqua-la-mer/engine/challenges';
import { answerSea, answerWatercourse, createGameContext, startGame } from '@/games/jusqua-la-mer/engine/game';
import { daysBetween } from '@/platform/daily';

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

describe('défi du jour', () => {
  const pool = dailyPool(dataset);

  it('puise dans les rivières faciles et moyennes ayant au moins une étape à citer', () => {
    // Environ quatre mois de défis avant qu’une rivière ne revienne.
    expect(pool.length).toBeGreaterThanOrEqual(100);
    for (const river of pool) {
      expect(river.difficulty).not.toBe('hard');
      expect(river.steps.some((step) => !step.optional)).toBe(true);
    }
  });

  it('numérote les défis depuis le premier jour', () => {
    expect(dailyChallenge(dataset, DAILY_EPOCH).number).toBe(1);
    expect(dailyChallenge(dataset, addDays(DAILY_EPOCH, 141)).number).toBe(142);
  });

  it('donne la même rivière pour la même date', () => {
    expect(dailyChallenge(dataset, '2026-12-25').river.id).toBe(dailyChallenge(dataset, '2026-12-25').river.id);
  });

  it("ne repasse aucune rivière avant d'avoir proposé toutes les autres", () => {
    const ids = pool.map((_, day) => dailyChallenge(dataset, addDays(DAILY_EPOCH, day)).river.id);
    expect(new Set(ids).size).toBe(pool.length);
    expect(daysBetween(DAILY_EPOCH, addDays(DAILY_EPOCH, pool.length))).toBe(pool.length);
  });
});

describe('partie libre', () => {
  it('tire une rivière du niveau demandé, en évitant les dernières jouées', () => {
    const first = randomRiver(dataset, 'hard', () => 0);
    expect(first.difficulty).toBe('hard');
    expect(randomRiver(dataset, 'hard', () => 0, [first.id]).id).not.toBe(first.id);
  });
});

describe('avec les vraies données', () => {
  it('se joue jusqu’à la mer pour le Loir', () => {
    const context = createGameContext(dataset, watercourseNames);
    const loir = dataset.rivers.find((river) => dataset.watercourses[river.id].name === 'Loir')!;
    let state = startGame(loir);
    for (const answer of ['la Sarthe', 'la Maine', 'la Loire']) {
      state = answerWatercourse(state, answer, context).state;
    }
    state = answerSea(state, 'atlantic').state;
    expect(state.status).toBe('won');
    expect(state.livesLeft).toBe(3);
  });
});
