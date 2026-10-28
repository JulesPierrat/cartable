import rawGeo from '@/assets/data/geo.json';

/**
 * Tracés générés par `scripts/data/build_geometries.py` : Lambert-93 en hectomètres, nord en haut.
 * Chaque ligne est une liste plate d'entiers, le premier point en absolu, les suivants en écart.
 */

export type Point = readonly [number, number];
export type Line = readonly Point[];
export type Box = { minX: number; minY: number; maxX: number; maxY: number };

type GeoDataset = {
  version: number;
  source: string;
  snapshot: string;
  france: number[][];
  watercourses: Record<string, number[][]>;
};

const geo = rawGeo as GeoDataset;

export const geoSource = geo.source;
export const geoSnapshot = geo.snapshot;

export function decodeLine(flat: readonly number[]): Line {
  const points: Point[] = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i + 1 < flat.length; i += 2) {
    x += flat[i];
    y += flat[i + 1];
    points.push([x, y]);
  }
  return points;
}

export const franceOutline: readonly Line[] = geo.france.map(decodeLine);

const decoded = new Map<string, readonly Line[]>();

/** Tracé d'un cours d'eau, ou `null` s'il n'en a pas (rivière étrangère, lac, estuaire). */
export function watercourseLines(id: string): readonly Line[] | null {
  const raw = geo.watercourses[id];
  if (!raw) {
    return null;
  }
  let lines = decoded.get(id);
  if (!lines) {
    lines = raw.map(decodeLine);
    decoded.set(id, lines);
  }
  return lines;
}

export function hasGeometry(id: string): boolean {
  return id in geo.watercourses;
}

export function boundsOf(lines: readonly Line[]): Box | null {
  let box: Box | null = null;
  for (const line of lines) {
    for (const [x, y] of line) {
      box = box
        ? { minX: Math.min(box.minX, x), minY: Math.min(box.minY, y), maxX: Math.max(box.maxX, x), maxY: Math.max(box.maxY, y) }
        : { minX: x, minY: y, maxX: x, maxY: y };
    }
  }
  return box;
}

export const franceBox = boundsOf(franceOutline)!;

export function unionBox(a: Box, b: Box | null): Box {
  return b
    ? { minX: Math.min(a.minX, b.minX), minY: Math.min(a.minY, b.minY), maxX: Math.max(a.maxX, b.maxX), maxY: Math.max(a.maxY, b.maxY) }
    : a;
}

/**
 * Cadre autour de `box` : une marge de `padding` (fraction), au moins `minSpan` de large et de haut,
 * et le rapport largeur / hauteur de la vue (`aspect`), centré.
 */
export function fitBox(box: Box, aspect: number, padding = 0.08, minSpan = 0): Box {
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  let width = Math.max((box.maxX - box.minX) * (1 + 2 * padding), minSpan);
  let height = Math.max((box.maxY - box.minY) * (1 + 2 * padding), minSpan);
  if (width / height > aspect) {
    height = width / aspect;
  } else {
    width = height * aspect;
  }
  return { minX: cx - width / 2, minY: cy - height / 2, maxX: cx + width / 2, maxY: cy + height / 2 };
}

/** Chemin SVG d'une ligne (fermé pour un contour). */
export function svgPath(line: Line, closed = false): string {
  if (line.length === 0) {
    return '';
  }
  const [first, ...rest] = line;
  return `M${first[0]} ${first[1]}${rest.map(([x, y]) => `L${x} ${y}`).join('')}${closed ? 'Z' : ''}`;
}
