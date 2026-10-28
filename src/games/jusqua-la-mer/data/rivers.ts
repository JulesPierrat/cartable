import rawNames from '@/assets/data/watercourse-names.json';
import rawRivers from '@/assets/data/rivers.json';

/** Les données viennent de `scripts/data/build_rivers.py` : ne jamais modifier les JSON à la main. */

export type SeaId = 'channel' | 'north-sea' | 'atlantic' | 'mediterranean';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Article = 'le' | 'la' | "l'" | 'les';

export type Sea = { name: string; article: Article; shortName: string };

export type Watercourse = {
  name: string;
  article: Article;
  sitelinks: number;
  sandreCode?: string;
  lengthKm?: number;
};

/** Une étape facultative (la Gironde, un lac traversé) peut être citée ou non. */
export type Step = { id: string; optional?: boolean };

export type River = {
  /** QID Wikidata de la rivière de départ. */
  id: string;
  /** Cours d'eau à citer après la rivière de départ, dans l'ordre. */
  steps: Step[];
  sea: SeaId;
  difficulty: Difficulty;
};

export type RiverDataset = {
  version: number;
  /** Date de l'instantané Wikidata. */
  snapshot: string;
  source: string;
  seas: Record<SeaId, Sea>;
  watercourses: Record<string, Watercourse>;
  rivers: River[];
};

export const dataset = rawRivers as RiverDataset;

/** Tous les noms de cours d'eau connus, pour l'autocomplétion (sans article, pour ne rien trahir). */
export const watercourseNames: readonly string[] = rawNames;

/** « le Loir », « l'Aisne », « les Gaves réunis ». */
export function withArticle({ name, article }: { name: string; article: Article }): string {
  return article === "l'" ? `l'${name}` : `${article} ${name}`;
}
