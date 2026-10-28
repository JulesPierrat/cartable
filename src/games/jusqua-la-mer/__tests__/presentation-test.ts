import { dataset } from '@/games/jusqua-la-mer/data/rivers';
import { answerWatercourse, requestHint, startGame } from '@/games/jusqua-la-mer/engine/game';
import {
  feedbackMessage,
  gameContext,
  hintText,
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

  it('donne une initiale pour une étape et une direction pour la mer', () => {
    const stepHint = requestHint(loir, gameContext).hint!;
    expect(hintText(stepHint, loir.river)).toBe('commence par « S »');
    const seine = startGame(riverNamed('Seine'));
    expect(hintText(requestHint(seine, gameContext).hint!, seine.river)).toBe('la mer est au nord-ouest');
  });

  it('tire une anecdote vraie des données', () => {
    expect(riverFact(riverNamed('Loir'))).toBe(
      'La Maine ne mesure que 11,5 km : une étape vite franchie, mais facile à oublier.',
    );
  });
});
