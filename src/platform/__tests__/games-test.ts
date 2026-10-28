import { availableGames, games } from '@/platform/games';

describe('registre des jeux', () => {
  it('a des identifiants uniques en kebab-case', () => {
    const ids = games.map((game) => game.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('propose au moins un jeu jouable', () => {
    expect(availableGames.length).toBeGreaterThan(0);
  });

  it("fait démarrer chaque jeu jouable sur une route sous /jeux/<id>/", () => {
    for (const game of availableGames) {
      expect(String(game.entry)).toMatch(new RegExp(`^/jeux/${game.id}/`));
    }
  });
});
