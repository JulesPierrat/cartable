import type { River, RiverDataset, SeaId, Step } from '@/games/jusqua-la-mer/data/rivers';
import { normalizeName } from '@/platform/text';

/**
 * Moteur de « Jusqu'à la mer » : TypeScript pur, sans React ni Expo. Chaque action prend
 * un état et renvoie le nouvel état avec le retour à afficher ; rien n'est modifié en place.
 */

export const DEFAULT_LIVES = 3;

/** Ce que le moteur doit savoir des données, en plus de la rivière jouée. */
export type GameContext = {
  dataset: RiverDataset;
  /** Noms normalisés de tous les cours d'eau connus : une saisie hors de cette liste est une faute de frappe, pas une erreur. */
  knownNames: ReadonlySet<string>;
};

export function createGameContext(dataset: RiverDataset, names: readonly string[]): GameContext {
  const knownNames = new Set(names.map(normalizeName));
  for (const watercourse of Object.values(dataset.watercourses)) {
    knownNames.add(normalizeName(watercourse.name));
  }
  return { dataset, knownNames };
}

export type Feedback =
  /** Bonne réponse : l'étape `stepIndex` est trouvée (les étapes facultatives d'avant sont sautées). */
  | { kind: 'found'; stepIndex: number }
  /** Ce cours d'eau ne fait pas partie du chemin. */
  | { kind: 'wrong' }
  /** Il fait partie du chemin, mais plus loin (« la Loire — pas directement ! »). */
  | { kind: 'downstream' }
  /** Déjà cité, ou c'est la rivière de départ : sans pénalité. */
  | { kind: 'already-found' }
  /** Nom inconnu (faute de frappe) : sans pénalité. */
  | { kind: 'unknown' }
  /** Bonne mer, et plus aucune étape obligatoire : partie gagnée. */
  | { kind: 'sea-correct' }
  /** Bonne mer, mais il reste des cours d'eau à citer avant. */
  | { kind: 'sea-too-early' }
  | { kind: 'sea-wrong' }
  /** La partie est terminée : l'action est ignorée. */
  | { kind: 'game-over' };

export type HintTarget = { kind: 'step'; stepIndex: number } | { kind: 'sea' };

/**
 * Un indice et son niveau. Pour une étape : niveau 1, la carte des rivières découvertes ;
 * niveau 2, la même carte avec le cours d'eau à trouver (son initiale sert quand il n'a pas de tracé).
 * Pour la mer, un seul niveau : le chemin jusqu'à la côte. Le moteur ne donne que la cible et le
 * niveau, l'écran choisit quoi montrer.
 */
export type Hint =
  | { target: { kind: 'step'; stepIndex: number }; level: 1 | 2; initial: string }
  | { target: { kind: 'sea' }; level: 1 };

/** Nombre d'indices possibles par cible. */
export const MAX_HINTS = { step: 2, sea: 1 } as const;

/** `at` : index de l'étape recherchée au moment du coup (pour afficher une erreur sous la bonne ligne). */
export type HistoryEntry =
  | { kind: 'answer'; input: string; feedback: Feedback; at: number }
  | { kind: 'sea'; sea: SeaId; feedback: Feedback; at: number }
  | { kind: 'hint'; hint: Hint };

export type StepStatus = 'found' | 'skipped' | 'pending';

export type GameState = {
  river: River;
  /** Statut de chaque étape de `river.steps`, dans l'ordre. */
  steps: StepStatus[];
  livesLeft: number;
  history: HistoryEntry[];
  status: 'playing' | 'won' | 'lost';
};

export type Outcome = { state: GameState; feedback: Feedback };

export function startGame(river: River, lives = DEFAULT_LIVES): GameState {
  return {
    river,
    steps: river.steps.map(() => 'pending'),
    livesLeft: lives,
    history: [],
    status: 'playing',
  };
}

/** Index de la prochaine étape à trouver, ou `river.steps.length` si toutes sont résolues. */
export function currentStepIndex(state: GameState): number {
  const index = state.steps.indexOf('pending');
  return index === -1 ? state.steps.length : index;
}

/** Index de la prochaine étape obligatoire, ou `null` s'il ne reste plus qu'à choisir la mer. */
export function nextRequiredStepIndex(state: GameState): number | null {
  const steps = state.river.steps;
  for (let i = currentStepIndex(state); i < steps.length; i++) {
    if (!steps[i].optional) {
      return i;
    }
  }
  return null;
}

/** Cite un cours d'eau : le suivant sur le chemin, ou une erreur. */
export function answerWatercourse(state: GameState, input: string, context: GameContext): Outcome {
  if (state.status !== 'playing') {
    return { state, feedback: { kind: 'game-over' } };
  }
  const answer = normalizeName(input);
  const { watercourses } = context.dataset;
  const nameOf = (step: Step) => normalizeName(watercourses[step.id].name);
  const steps = state.river.steps;
  const current = currentStepIndex(state);

  // Les réponses acceptées : les étapes facultatives qui suivent, et la première étape obligatoire.
  const required = nextRequiredStepIndex(state);
  const lastAccepted = required ?? steps.length - 1;
  for (let i = current; i <= lastAccepted; i++) {
    if (nameOf(steps[i]) === answer) {
      const nextSteps = state.steps.map((status, j): StepStatus =>
        j === i ? 'found' : j >= current && j < i ? 'skipped' : status,
      );
      return record(state, { kind: 'answer', input, feedback: { kind: 'found', stepIndex: i }, at: current }, nextSteps);
    }
  }

  const alreadyCited =
    normalizeName(watercourses[state.river.id].name) === answer ||
    steps.some((step, i) => state.steps[i] !== 'pending' && nameOf(step) === answer);
  const feedback: Feedback = alreadyCited
    ? { kind: 'already-found' }
    : steps.some((step, i) => i > lastAccepted && nameOf(step) === answer)
      ? { kind: 'downstream' }
      : context.knownNames.has(answer)
        ? { kind: 'wrong' }
        : { kind: 'unknown' };
  return record(state, { kind: 'answer', input, feedback, at: current });
}

/** Désigne la mer où finit le chemin : gagné si plus aucune étape obligatoire ne manque. */
export function answerSea(state: GameState, sea: SeaId): Outcome {
  if (state.status !== 'playing') {
    return { state, feedback: { kind: 'game-over' } };
  }
  const at = currentStepIndex(state);
  if (sea !== state.river.sea) {
    return record(state, { kind: 'sea', sea, feedback: { kind: 'sea-wrong' }, at });
  }
  if (nextRequiredStepIndex(state) !== null) {
    return record(state, { kind: 'sea', sea, feedback: { kind: 'sea-too-early' }, at });
  }
  const steps = state.steps.map((status): StepStatus => (status === 'pending' ? 'skipped' : status));
  return record(state, { kind: 'sea', sea, feedback: { kind: 'sea-correct' }, at }, steps);
}

export type HintRefusal = 'all-given' | 'last-life' | 'game-over';

/**
 * Indice suivant sur la prochaine étape obligatoire (deux niveaux), ou sur la mer s'il n'en reste
 * plus (un niveau). Chaque indice coûte une vie ; il est refusé quand il ne reste qu'une vie.
 */
export function requestHint(
  state: GameState,
  context: GameContext,
): { state: GameState; hint: Hint | null; refusal?: HintRefusal } {
  if (state.status !== 'playing') {
    return { state, hint: null, refusal: 'game-over' };
  }
  const target = currentHintTarget(state);
  const given = hintsFor(state, target).length;
  if (given >= MAX_HINTS[target.kind]) {
    return { state, hint: null, refusal: 'all-given' };
  }
  if (state.livesLeft <= 1) {
    return { state, hint: null, refusal: 'last-life' };
  }
  const { watercourses } = context.dataset;
  const hint: Hint =
    target.kind === 'step'
      ? {
          target,
          level: given === 0 ? 1 : 2,
          initial: watercourses[state.river.steps[target.stepIndex].id].name.charAt(0).toUpperCase(),
        }
      : { target, level: 1 };
  return {
    state: { ...state, livesLeft: state.livesLeft - 1, history: [...state.history, { kind: 'hint', hint }] },
    hint,
  };
}

/** Les indices déjà donnés pour une cible, dans l'ordre. */
export function hintsFor(state: GameState, target: HintTarget): Hint[] {
  return state.history.flatMap((entry) =>
    entry.kind === 'hint' && sameTarget(entry.hint.target, target) ? [entry.hint] : [],
  );
}

/** Le dernier indice donné pour une cible (le plus fort), s'il y en a un. */
export function hintFor(state: GameState, target: HintTarget): Hint | undefined {
  return hintsFor(state, target).at(-1);
}

/** Cible de l'indice pour l'étape en cours : la prochaine étape obligatoire, ou la mer. */
export function currentHintTarget(state: GameState): HintTarget {
  const required = nextRequiredStepIndex(state);
  return required === null ? { kind: 'sea' } : { kind: 'step', stepIndex: required };
}

/** Les retours qui coûtent une vie. */
export function isMistake(feedback: Feedback): boolean {
  return (
    feedback.kind === 'wrong' ||
    feedback.kind === 'downstream' ||
    feedback.kind === 'sea-too-early' ||
    feedback.kind === 'sea-wrong'
  );
}

export type GridCell = 'hit' | 'miss' | 'hint';

/** Grille de la partie, dans l'ordre : une case par bonne réponse, erreur ou indice (pour le partage). */
export function gameGrid(state: GameState): GridCell[] {
  const grid: GridCell[] = [];
  for (const entry of state.history) {
    if (entry.kind === 'hint') {
      grid.push('hint');
    } else if (entry.feedback.kind === 'found' || entry.feedback.kind === 'sea-correct') {
      grid.push('hit');
    } else if (isMistake(entry.feedback)) {
      grid.push('miss');
    }
  }
  return grid;
}

export function mistakeCount(state: GameState): number {
  return gameGrid(state).filter((cell) => cell === 'miss').length;
}

/** Score sur 100 : chaque vie perdue (erreur ou indice) coûte 25 points ; une partie perdue vaut 0. */
export function score(state: GameState): number {
  if (state.status !== 'won') {
    return 0;
  }
  const livesLost = gameGrid(state).filter((cell) => cell !== 'hit').length;
  return Math.max(0, 100 - 25 * livesLost);
}

/** Enregistre une réponse (cours d'eau ou mer), retire une vie si c'est une erreur et met à jour le statut. */
function record(
  state: GameState,
  entry: Exclude<HistoryEntry, { kind: 'hint' }>,
  steps = state.steps,
): Outcome {
  const { feedback } = entry;
  const livesLeft = isMistake(feedback) ? state.livesLeft - 1 : state.livesLeft;
  const status = feedback.kind === 'sea-correct' ? 'won' : livesLeft <= 0 ? 'lost' : 'playing';
  return { state: { ...state, steps, livesLeft, status, history: [...state.history, entry] }, feedback };
}

function sameTarget(a: HintTarget, b: HintTarget): boolean {
  return a.kind === b.kind && (a.kind === 'sea' || (b.kind === 'step' && a.stepIndex === b.stepIndex));
}
