import { contrastRatio } from '@/platform/contrast';
import { palettes, type ColorName } from '@/platform/theme';

/** Paires texte / fond réellement utilisées dans les écrans : chacune doit atteindre 4,5:1 (WCAG AA). */
const textPairs: [ColorName, ColorName][] = [
  ['ink', 'background'],
  ['ink', 'surface'],
  ['inkSoft', 'surface'],
  ['inkSoft', 'surfaceMuted'],
  ['inkMuted', 'background'],
  ['inkMuted', 'surface'],
  ['inkMuted', 'surfaceMuted'],
  ['water', 'background'],
  ['water', 'surface'],
  ['onWater', 'water'],
  ['white', 'hero'],
  ['nightText', 'hero'],
  ['hero', 'white'],
  ['night', 'waterSoft'],
  ['night', 'waterTint'],
  ['night', 'surface'],
  ['error', 'surface'],
  ['error', 'errorSoft'],
  ['ink', 'land'],
];

describe.each(['light', 'dark'] as const)('contrastes du thème %s', (theme) => {
  it.each(textPairs)('%s sur %s est lisible', (text, background) => {
    expect(contrastRatio(palettes[theme][text], palettes[theme][background])).toBeGreaterThanOrEqual(4.5);
  });
});

it('calcule le ratio maximal entre le noir et le blanc', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
});
