import { buildNameIndex, suggest } from '@/platform/autocomplete';

const index = buildNameIndex(['Marne', 'Maine', 'Mayenne', 'Madon', "Gave d'Oloron", 'Saône', 'Somme']);

describe('suggest', () => {
  it("propose les noms qui commencent par la saisie, dans l'ordre de l'index", () => {
    expect(suggest(index, 'Ma')).toEqual(['Marne', 'Maine', 'Mayenne']);
  });

  it('ignore accents, majuscules et article', () => {
    expect(suggest(index, 'la SAO')).toEqual(['Saône']);
  });

  it("trouve aussi un mot à l'intérieur du nom, après les débuts de nom", () => {
    expect(suggest(index, 'oloron')).toEqual(["Gave d'Oloron"]);
  });

  it('respecte la limite et ne propose rien pour une saisie vide', () => {
    expect(suggest(index, 'm', 2)).toEqual(['Marne', 'Maine']);
    expect(suggest(index, '  ')).toEqual([]);
  });
});
