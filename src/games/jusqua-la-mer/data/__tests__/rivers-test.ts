import { dataset, watercourseNames, withArticle, type SeaId } from '@/games/jusqua-la-mer/data/rivers';

const { rivers, watercourses, seas } = dataset;

/** Chaîne d'une rivière jouable, retrouvée par son nom ; une étape facultative est entre parenthèses. */
function chainOf(name: string): { steps: string[]; sea: SeaId } {
  const river = rivers.find((r) => watercourses[r.id].name === name);
  if (!river) {
    throw new Error(`${name} n'est pas une rivière jouable`);
  }
  return {
    steps: river.steps.map(({ id, optional }) =>
      optional ? `(${watercourses[id].name})` : watercourses[id].name,
    ),
    sea: river.sea,
  };
}

describe('données de « Jusqu’à la mer »', () => {
  it('propose assez de rivières pour l’alpha', () => {
    expect(rivers.length).toBeGreaterThanOrEqual(200);
  });

  it('décrit chaque rivière et chaque étape, et finit dans une des quatre mers', () => {
    for (const river of rivers) {
      expect(watercourses[river.id]).toBeDefined();
      for (const step of river.steps) {
        expect(watercourses[step.id]).toBeDefined();
      }
      expect(seas[river.sea]).toBeDefined();
    }
  });

  it('ne propose pas deux rivières de départ du même nom', () => {
    const names = rivers.map((r) => watercourses[r.id].name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('connaît tous les noms des étapes dans l’autocomplétion, parmi des milliers d’autres', () => {
    const known = new Set(watercourseNames);
    for (const river of rivers) {
      for (const step of river.steps) {
        expect(known).toContain(watercourses[step.id].name);
      }
    }
    expect(watercourseNames.length).toBeGreaterThan(1000);
  });

  it.each([
    ['Loir', ['Sarthe', 'Maine', 'Loire'], 'atlantic'],
    ['Aisne', ['Oise', 'Seine'], 'channel'],
    ['Gartempe', ['Creuse', 'Vienne', 'Loire'], 'atlantic'],
    ['Vologne', ['Moselle', 'Rhin'], 'north-sea'],
    ['Ognon', ['Saône', 'Rhône'], 'mediterranean'],
    ['Garonne', ['(Gironde)'], 'atlantic'],
    ['Versoix', ['(Léman)', 'Rhône'], 'mediterranean'],
    ['Alzette', ['Sûre', 'Moselle', 'Rhin'], 'north-sea'],
    ['Nive', ['Adour'], 'atlantic'],
    ['Golo', [], 'mediterranean'],
  ])('%s → %j → %s', (name, steps, sea) => {
    expect(chainOf(name)).toEqual({ steps, sea });
  });

  it('accorde le nom avec son article', () => {
    expect(withArticle({ name: 'Loir', article: 'le' })).toBe('le Loir');
    expect(withArticle({ name: 'Aisne', article: "l'" })).toBe("l'Aisne");
    expect(withArticle(watercourses[rivers.find((r) => watercourses[r.id].name === 'Sarthe')!.id])).toBe(
      'la Sarthe',
    );
  });
});
