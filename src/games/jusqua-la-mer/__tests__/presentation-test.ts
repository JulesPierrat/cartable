import { dataset } from '@/games/jusqua-la-mer/data/rivers';
import { answerWatercourse, requestHint, startGame } from '@/games/jusqua-la-mer/engine/game';
import {
  feedbackMessage,
  gameContext,
  hintCaption,
  hintMap,
  missLabel,
  parseMode,
  riverFact,
  setupGame,
} from '@/games/jusqua-la-mer/presentation';

const riverNamed = (name: string) => dataset.rivers.find((river) => dataset.watercourses[river.id].name === name)!;

describe('présentation de « Jusqu’à la mer »', () => {
  const loir = startGame(riverNamed('Loir'));

  it('lit le mode de jeu dans les paramètres de route', () => {
    expect(parseMode('hard')).toBe('hard');
    expect(parseMode(undefined)).toBe('daily');
    expect(parseMode('n’importe quoi')).toBe('daily');
  });

  it('prépare le défi du jour avec son numéro', () => {
    const setup = setupGame('daily', new Date(2026, 9, 28, 12));
    expect(setup.dailyNumber).toBe(1);
  });

  it('écrit les messages avec l’article quand le cours d’eau est sur le chemin', () => {
    const { state, feedback } = answerWatercourse(loir, 'loire', gameContext);
    expect(feedbackMessage(feedback, 'loire', state)).toBe('La Loire : pas directement !');
    expect(missLabel('loire', state)).toBe('la Loire');
  });

  it('garde le nom seul pour un cours d’eau hors du chemin', () => {
    const { state, feedback } = answerWatercourse(loir, 'garonne', gameContext);
    expect(feedbackMessage(feedback, 'garonne', state)).toBe('« Garonne » ne fait pas partie du chemin.');
    expect(missLabel('garonne', state)).toBe('Garonne');
  });

  it('montre sur la carte le cours d’eau à trouver, sans écrire son nom', () => {
    const stepHint = requestHint(loir, gameContext).hint!;
    const sarthe = loir.river.steps[0].id;
    expect(hintMap(stepHint, loir)).toEqual({ known: [loir.river.id], highlight: [sarthe] });
    expect(hintCaption(stepHint, loir)).toBe(
      "En bleu vif, le cours d'eau dans lequel se jette le Loir. À toi de trouver son nom !",
    );
  });

  it('ne montre sur la carte que les rivières découvertes et la rivière en cours', () => {
    let state = startGame(riverNamed('Loir'));
    state = answerWatercourse(state, 'Sarthe', gameContext).state;
    const hint = requestHint(state, gameContext).hint!;
    const [sarthe, maine] = state.river.steps.map((step) => step.id);
    expect(hintMap(hint, state)).toEqual({ known: [state.river.id, sarthe], highlight: [maine] });
  });

  it('pour la mer, met en avant le chemin jusqu’à la côte', () => {
    const seine = startGame(riverNamed('Seine'));
    const seaHint = requestHint(seine, gameContext).hint!;
    expect(hintMap(seaHint, seine)).toEqual({ known: [], highlight: [seine.river.id] });
    expect(hintCaption(seaHint, seine)).toBe("Suis la Seine jusqu'à la côte pour trouver sa mer.");
  });

  it('donne l’initiale quand le cours d’eau n’a pas de tracé (hors de France)', () => {
    const segre = startGame(riverNamed('Sègre'));
    expect(hintCaption(requestHint(segre, gameContext).hint!, segre)).toBe(
      "Ce cours d'eau coule hors de France et n'a pas de tracé : son nom commence par « È ».",
    );
  });

  it('tire une anecdote vraie des données', () => {
    expect(riverFact(riverNamed('Loir'))).toBe(
      'La Maine ne mesure que 11,5 km : une étape vite franchie, mais facile à oublier.',
    );
  });
});
