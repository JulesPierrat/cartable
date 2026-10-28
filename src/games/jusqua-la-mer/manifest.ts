import type { GameManifest } from '@/platform/games';

export const jusquaLaMer = {
  id: 'jusqua-la-mer',
  title: "Jusqu'à la mer",
  tagline: "Une rivière t'est donnée : retrouve son chemin, d'affluent en fleuve, jusqu'à la mer.",
  status: 'available',
  entry: '/jeux/jusqua-la-mer/regles',
  estimatedMinutes: 2,
  lives: 3,
} as const satisfies GameManifest;
