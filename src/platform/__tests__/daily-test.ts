import { daysBetween, localDateKey, pickForDay, seededRandom, shuffle } from '@/platform/daily';

describe('jour et tirage du défi', () => {
  it('donne la date locale au format AAAA-MM-JJ', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('compte les jours entre deux dates, changement d’heure compris', () => {
    expect(daysBetween('2026-10-28', '2026-10-28')).toBe(0);
    expect(daysBetween('2026-10-24', '2026-10-27')).toBe(3);
    expect(daysBetween('2026-10-28', '2027-10-28')).toBe(365);
    expect(daysBetween('2026-10-28', '2026-10-27')).toBe(-1);
  });

  it('produit la même suite pour la même graine', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('mélange sans perdre ni dupliquer', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    expect([...shuffle(items, seededRandom(1))].sort((x, y) => x - y)).toEqual(items);
  });

  it('sort chaque élément une fois par cycle, avec un ordre différent à chaque cycle', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const firstCycle = items.map((_, day) => pickForDay(items, day, 7));
    const secondCycle = items.map((_, day) => pickForDay(items, day + items.length, 7));
    expect([...firstCycle].sort()).toEqual(items);
    expect([...secondCycle].sort()).toEqual(items);
    expect(secondCycle).not.toEqual(firstCycle);
  });
});
