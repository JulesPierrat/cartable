import type { River, RiverDataset, Watercourse } from '@/games/jusqua-la-mer/data/rivers';
import {
  answerSea,
  answerWatercourse,
  createGameContext,
  currentStepIndex,
  gameGrid,
  hintFor,
  nextRequiredStepIndex,
  requestHint,
  score,
  startGame,
  type GameState,
} from '@/games/jusqua-la-mer/engine/game';

const wc = (name: string, article: Watercourse['article'] = 'la'): Watercourse => ({ name, article, sitelinks: 10 });

const dataset: RiverDataset = {
  version: 1,
  snapshot: '2026-10-28',
  source: 'test',
  seas: {
    channel: { name: 'Manche', article: 'la', shortName: 'Manche' },
    'north-sea': { name: 'mer du Nord', article: 'la', shortName: 'Mer du Nord' },
    atlantic: { name: 'océan Atlantique', article: "l'", shortName: 'Atlantique' },
    mediterranean: { name: 'mer Méditerranée', article: 'la', shortName: 'Méditerranée' },
  },
  watercourses: {
    loir: wc('Loir', 'le'),
    sarthe: wc('Sarthe'),
    maine: wc('Maine'),
    loire: wc('Loire'),
    garonne: wc('Garonne'),
    gironde: wc('Gironde'),
    versoix: wc('Versoix'),
    leman: wc('Léman', 'le'),
    rhone: wc('Rhône', 'le'),
  },
  rivers: [],
};

const loir: River = {
  id: 'loir',
  steps: [{ id: 'sarthe' }, { id: 'maine' }, { id: 'loire' }],
  sea: 'atlantic',
  difficulty: 'hard',
};
const garonne: River = { id: 'garonne', steps: [{ id: 'gironde', optional: true }], sea: 'atlantic', difficulty: 'easy' };
const versoix: River = {
  id: 'versoix',
  steps: [{ id: 'leman', optional: true }, { id: 'rhone' }],
  sea: 'mediterranean',
  difficulty: 'medium',
};

const context = createGameContext(dataset, ['Marne', 'Seine', 'Garonne']);

/** Joue une suite de coups : un nom de cours d'eau, ou `{ sea }` pour désigner une mer. */
function play(river: River, moves: (string | { sea: GameState['river']['sea'] })[]) {
  let state = startGame(river);
  const feedbacks: string[] = [];
  for (const move of moves) {
    const outcome = typeof move === 'string' ? answerWatercourse(state, move, context) : answerSea(state, move.sea);
    state = outcome.state;
    feedbacks.push(outcome.feedback.kind);
  }
  return { state, feedbacks };
}

describe('une partie de « Jusqu’à la mer »', () => {
  it('rejoue la partie des maquettes : la Loire trop tôt, puis le bon chemin', () => {
    const { state, feedbacks } = play(loir, ['La Loire', 'la sarthe', 'MAINE', 'Loire', { sea: 'atlantic' }]);
    expect(feedbacks).toEqual(['downstream', 'found', 'found', 'found', 'sea-correct']);
    expect(state.status).toBe('won');
    expect(state.livesLeft).toBe(2);
    expect(state.steps).toEqual(['found', 'found', 'found']);
    expect(gameGrid(state)).toEqual(['miss', 'hit', 'hit', 'hit', 'hit']);
    expect(score(state)).toBe(75);
  });

  it("ne pénalise ni une faute de frappe, ni un cours d'eau déjà cité", () => {
    const { state, feedbacks } = play(loir, ['Sartre', 'Loir', 'Sarthe', 'Sarthe']);
    expect(feedbacks).toEqual(['unknown', 'already-found', 'found', 'already-found']);
    expect(state.livesLeft).toBe(3);
  });

  it("compte comme erreur un cours d'eau connu qui n'est pas sur le chemin", () => {
    const { state, feedbacks } = play(loir, ['Marne']);
    expect(feedbacks).toEqual(['wrong']);
    expect(state.livesLeft).toBe(2);
  });

  it('refuse la bonne mer tant qu’il reste des étapes, et la mauvaise mer', () => {
    const { state, feedbacks } = play(loir, [{ sea: 'atlantic' }, { sea: 'channel' }]);
    expect(feedbacks).toEqual(['sea-too-early', 'sea-wrong']);
    expect(state.livesLeft).toBe(1);
    expect(state.status).toBe('playing');
  });

  it('perd la partie à la troisième erreur, puis ignore les coups suivants', () => {
    const { state, feedbacks } = play(loir, ['Marne', 'Seine', 'Garonne', 'Sarthe']);
    expect(feedbacks).toEqual(['wrong', 'wrong', 'wrong', 'game-over']);
    expect(state.status).toBe('lost');
    expect(score(state)).toBe(0);
  });

  describe('étape facultative (la Gironde)', () => {
    it('gagne en allant directement à la mer', () => {
      const { state } = play(garonne, [{ sea: 'atlantic' }]);
      expect(state.status).toBe('won');
      expect(state.steps).toEqual(['skipped']);
    });

    it('gagne aussi en citant la Gironde', () => {
      const { state, feedbacks } = play(garonne, ['Gironde', { sea: 'atlantic' }]);
      expect(feedbacks).toEqual(['found', 'sea-correct']);
      expect(state.steps).toEqual(['found']);
    });
  });

  describe('lac traversé (le Léman)', () => {
    it('accepte le Rhône directement, en sautant le lac', () => {
      const { state, feedbacks } = play(versoix, ['Rhône', { sea: 'mediterranean' }]);
      expect(feedbacks).toEqual(['found', 'sea-correct']);
      expect(state.steps).toEqual(['skipped', 'found']);
    });

    it("accepte le lac, puis attend toujours le Rhône", () => {
      let { state } = play(versoix, ['Léman']);
      expect(currentStepIndex(state)).toBe(1);
      expect(nextRequiredStepIndex(state)).toBe(1);
      ({ state } = play(versoix, ['Léman', { sea: 'mediterranean' }]));
      expect(state.history.at(-1)).toMatchObject({ feedback: { kind: 'sea-too-early' } });
    });
  });

  describe('indices', () => {
    it('en donne deux par étape, chacun contre une vie : la carte, puis le cours d’eau à trouver', () => {
      let state = startGame(loir);
      const first = requestHint(state, context);
      expect(first.hint).toEqual({ target: { kind: 'step', stepIndex: 0 }, level: 1, initial: 'S' });
      state = first.state;
      const second = requestHint(state, context);
      expect(second.hint).toEqual({ target: { kind: 'step', stepIndex: 0 }, level: 2, initial: 'S' });
      state = second.state;
      expect(state.livesLeft).toBe(1);
      expect(requestHint(state, context)).toMatchObject({ hint: null, refusal: 'all-given' });
      expect(hintFor(state, { kind: 'step', stepIndex: 0 })?.level).toBe(2);
    });

    it('recommence au 1er indice à l’étape suivante', () => {
      let state = requestHint(startGame(loir), context).state;
      state = answerWatercourse(state, 'Sarthe', context).state;
      expect(requestHint(state, context).hint).toMatchObject({ level: 1, initial: 'M' });
    });

    it("n'en donne qu'un sur la mer, quand il n'y a plus de cours d'eau à citer", () => {
      const { state, hint } = requestHint(startGame(garonne), context);
      expect(hint).toEqual({ target: { kind: 'sea' }, level: 1 });
      expect(requestHint(state, context).refusal).toBe('all-given');
    });

    it('coûtent une vie, comptent dans le score et apparaissent dans la grille', () => {
      let state = requestHint(startGame(garonne), context).state;
      expect(state.livesLeft).toBe(2);
      state = answerSea(state, 'atlantic').state;
      expect(gameGrid(state)).toEqual(['hint', 'hit']);
      expect(score(state)).toBe(75);
    });

    it('sont refusés à la dernière vie', () => {
      let state = answerWatercourse(startGame(loir), 'Marne', context).state;
      state = answerWatercourse(state, 'Seine', context).state;
      expect(state.livesLeft).toBe(1);
      expect(requestHint(state, context)).toMatchObject({ hint: null, refusal: 'last-life' });
    });
  });
});
