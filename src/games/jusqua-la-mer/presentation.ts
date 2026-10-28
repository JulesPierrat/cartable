import { dataset, watercourseNames, withArticle, type Difficulty, type River, type SeaId } from '@/games/jusqua-la-mer/data/rivers';
import { dailyChallenge, randomRiver } from '@/games/jusqua-la-mer/engine/challenges';
import {
  createGameContext,
  currentStepIndex,
  type Feedback,
  type GameState,
  type Hint,
} from '@/games/jusqua-la-mer/engine/game';
import { hasGeometry } from '@/games/jusqua-la-mer/data/geo';
import { buildNameIndex } from '@/platform/autocomplete';
import { localDateKey } from '@/platform/daily';
import { capitalize, normalizeName } from '@/platform/text';

/** Ce qui relie le moteur aux écrans : textes, noms affichés, choix de la rivière. Pas de React ici. */

export const gameContext = createGameContext(dataset, watercourseNames);
export const nameIndex = buildNameIndex(watercourseNames);

export type GameMode = 'daily' | Difficulty;

export const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Expert',
};

export function parseMode(value: string | string[] | undefined): GameMode {
  return value === 'easy' || value === 'medium' || value === 'hard' ? value : 'daily';
}

export type GameSetup = { mode: GameMode; river: River; dailyNumber?: number };

const recentFreeRivers: string[] = [];

export function setupGame(mode: GameMode, now = new Date()): GameSetup {
  if (mode === 'daily') {
    const { number, river } = dailyChallenge(dataset, localDateKey(now));
    return { mode, river, dailyNumber: number };
  }
  const river = randomRiver(dataset, mode, Math.random, recentFreeRivers);
  recentFreeRivers.unshift(river.id);
  recentFreeRivers.splice(20);
  return { mode, river };
}

/** « le Loir » ; `capitalize` pour un début de phrase. */
export function watercourseName(id: string): string {
  return withArticle(dataset.watercourses[id]);
}

export function seaName(sea: SeaId): string {
  return withArticle(dataset.seas[sea]);
}

/** Nom tel qu'il est écrit dans les données (« Saône » pour « saone »), sinon la saisie telle quelle. */
export function canonicalName(input: string): string {
  const normalized = normalizeName(input);
  return nameIndex.find((entry) => entry.normalized === normalized)?.name ?? input.trim();
}

/** Le dernier cours d'eau trouvé (ou la rivière de départ) : c'est lui dont on cherche l'embouchure. */
export function lastFoundId(state: GameState): string {
  const steps = state.river.steps;
  for (let i = currentStepIndex(state) - 1; i >= 0; i--) {
    if (state.steps[i] === 'found') {
      return steps[i].id;
    }
  }
  return state.river.id;
}

/** Nom avec son article si le cours d'eau saisi est sur le chemin (« la Loire »), sinon entre guillemets. */
export function answerDisplayName(input: string, state: GameState): string {
  const normalized = normalizeName(input);
  const onPath = [state.river.id, ...state.river.steps.map((step) => step.id)].find(
    (id) => normalizeName(dataset.watercourses[id].name) === normalized,
  );
  return onPath ? watercourseName(onPath) : `« ${canonicalName(input)} »`;
}

/** Libellé d'une erreur dans la chaîne : « la Loire » si elle est sur le chemin, sinon le nom seul (« Garonne »). */
export function missLabel(input: string, state: GameState): string {
  const name = answerDisplayName(input, state);
  return name.startsWith('« ') ? canonicalName(input) : name;
}

/** Message à afficher après un coup, ou `null` quand la chaîne qui s'anime suffit. */
export function feedbackMessage(feedback: Feedback, input: string, state: GameState): string | null {
  const name = answerDisplayName(input, state);
  switch (feedback.kind) {
    case 'found':
    case 'sea-correct':
    case 'game-over':
      return null;
    case 'wrong':
      return `${capitalize(name)} ne fait pas partie du chemin.`;
    case 'downstream':
      return `${capitalize(name)} : pas directement !`;
    case 'already-found':
      return `${capitalize(name)} est déjà sur ton chemin.`;
    case 'unknown':
      return `Je ne connais pas « ${input.trim()} » : choisis une suggestion.`;
    case 'sea-too-early':
      return `Pas encore : ${watercourseName(lastFoundId(state))} ne se jette pas directement dans la mer.`;
    case 'sea-wrong':
      return "Ce n'est pas la bonne mer.";
  }
}

/** Cours d'eau connus à ce stade de la partie : la rivière de départ et les étapes trouvées. */
export function knownPath(state: GameState): string[] {
  return [state.river.id, ...state.river.steps.filter((_, i) => state.steps[i] === 'found').map((step) => step.id)];
}

/**
 * Ce que montre la carte d'un indice. 1er indice : les rivières découvertes seulement.
 * 2e indice : les rivières découvertes et le cours d'eau à trouver. Mer : le chemin jusqu'à la côte.
 */
export function hintMap(hint: Hint, state: GameState): { known: string[]; highlight: string[] } {
  const path = knownPath(state);
  if (!('initial' in hint)) {
    return { known: [], highlight: path };
  }
  return { known: path, highlight: hint.level === 2 ? [state.river.steps[hint.target.stepIndex].id] : [] };
}

/** Légende de la carte d'indice, sans jamais écrire la réponse. */
export function hintCaption(hint: Hint, state: GameState): string {
  const from = watercourseName(lastFoundId(state));
  if (!('initial' in hint)) {
    return `Suis ${from} jusqu'à la côte pour trouver sa mer.`;
  }
  if (hint.level === 1) {
    return `Voici le chemin déjà découvert. Dans quel cours d'eau se jette ${from} ?`;
  }
  const target = state.river.steps[hint.target.stepIndex].id;
  return hasGeometry(target)
    ? `En bleu vif, le cours d'eau dans lequel se jette ${from}. À toi de trouver son nom !`
    : `Ce cours d'eau coule hors de France et n'a pas de tracé : son nom commence par « ${hint.initial} ».`;
}

export const victoryTitles: Record<SeaId, string> = {
  atlantic: "Jusqu'à l'océan !",
  channel: "Jusqu'à la Manche !",
  'north-sea': "Jusqu'à la mer du Nord !",
  mediterranean: "Jusqu'à la Méditerranée !",
};

/** Une anecdote vraie, tirée des données (longueurs Wikidata). */
export function riverFact(river: River): string | null {
  const { watercourses } = dataset;
  const start = watercourses[river.id];
  const shortStep = river.steps
    .map((step) => ({ id: step.id, length: watercourses[step.id].lengthKm }))
    .find((step) => step.length !== undefined && step.length < 25);
  if (shortStep) {
    return `${capitalize(watercourseName(shortStep.id))} ne mesure que ${formatKm(shortStep.length!)} : une étape vite franchie, mais facile à oublier.`;
  }
  if (start.lengthKm !== undefined) {
    const next = river.steps.find((step) => !step.optional);
    const destination = next ? watercourseName(next.id) : seaName(river.sea);
    return `${capitalize(watercourseName(river.id))} parcourt ${formatKm(start.lengthKm)} avant de rejoindre ${destination}.`;
  }
  return null;
}

function formatKm(km: number): string {
  return `${km.toLocaleString('fr-FR', { maximumFractionDigits: km < 100 ? 1 : 0 })} km`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}
