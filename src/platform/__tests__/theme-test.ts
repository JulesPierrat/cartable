import { contrastRatio } from '@/platform/contrast';
import { colors } from '@/platform/theme';

/** Paires texte / fond réellement utilisées dans les écrans : chacune doit atteindre 4,5:1 (WCAG AA). */
const textPairs: [keyof typeof colors, keyof typeof colors][] = [
  ['ink', 'background'],
  ['ink', 'surface'],
  ['inkSoft', 'surfaceMuted'],
  ['inkMuted', 'background'],
  ['inkMuted', 'surface'],
  ['inkMuted', 'surfaceMuted'],
  ['water', 'background'],
  ['water', 'surface'],
  ['white', 'water'],
  ['white', 'night'],
  ['nightText', 'night'],
  ['night', 'waterSoft'],
  ['night', 'white'],
  ['error', 'surface'],
  ['error', 'errorSoft'],
];

describe('contrastes du thème', () => {
  it.each(textPairs)('%s sur %s est lisible', (text, background) => {
    expect(contrastRatio(colors[text], colors[background])).toBeGreaterThanOrEqual(4.5);
  });

  it('calcule le ratio maximal entre le noir et le blanc', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });
});
