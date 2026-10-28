import { normalizeName } from '@/platform/text';

describe('normalizeName', () => {
  it.each([
    ["L'Hers-Vif", 'hers vif'],
    ['l’hers vif', 'hers vif'],
    ['HERS VIF', 'hers vif'],
    ['la Saône', 'saone'],
    ['  le   Rhône ', 'rhone'],
    ['Les Gaves réunis', 'gaves reunis'],
    ["Gave d'Oloron", 'gave d oloron'],
    ['Œuf', 'oeuf'],
    ['Èbre', 'ebre'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeName(input)).toBe(expected);
  });

  it("ne retire pas un « le » qui fait partie d'un mot", () => {
    expect(normalizeName('Lez')).toBe('lez');
    expect(normalizeName('Leschère')).toBe('leschere');
  });
});
