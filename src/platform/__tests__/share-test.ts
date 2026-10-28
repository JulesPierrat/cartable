import { formatDuration, shareGrid, timeUntilMidnight } from '@/platform/share';

describe('partage', () => {
  it('traduit la grille en carrés de couleur', () => {
    expect(shareGrid(['miss', 'hit', 'hint', 'hit'])).toBe('🟧🟦💡🟦');
  });

  it('compte le temps jusqu’à minuit, heure locale', () => {
    expect(timeUntilMidnight(new Date(2026, 9, 28, 22, 48))).toBe('1 h 12 min');
    expect(timeUntilMidnight(new Date(2026, 9, 28, 23, 55))).toBe('5 min');
  });

  it('formate une durée de partie', () => {
    expect(formatDuration(102_000)).toBe('1 min 42 s');
    expect(formatDuration(9_400)).toBe('9 s');
  });
});
