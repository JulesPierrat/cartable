import type { Href } from 'expo-router';

import { jusquaLaMer } from '@/games/jusqua-la-mer/manifest';

/** Ce que la plateforme doit savoir d'un mini-jeu pour l'afficher sur l'accueil. */
export type GameManifest = {
  /** Identifiant stable, en kebab-case : sert aux stats, à la série et au défi du jour. */
  id: string;
  title: string;
  /** Une phrase qui explique le jeu. */
  tagline: string;
} & (
  | {
      status: 'available';
      /** Premier écran du jeu (les règles). */
      entry: Href;
      estimatedMinutes: number;
      lives: number;
    }
  | { status: 'soon' }
);

export type AvailableGame = Extract<GameManifest, { status: 'available' }>;

/** Tous les mini-jeux, dans l'ordre d'affichage. Pour en ajouter un : un dossier dans `src/games/` et une ligne ici. */
export const games: readonly GameManifest[] = [
  jusquaLaMer,
  { id: 'prefectures', title: 'Préfectures', tagline: 'Une ville, un département', status: 'soon' },
  { id: 'silhouettes', title: 'Silhouettes', tagline: 'Reconnais le département', status: 'soon' },
];

export const availableGames = games.filter(
  (game): game is AvailableGame => game.status === 'available',
);

export const upcomingGames = games.filter((game) => game.status === 'soon');
