import type { Box, Line } from '@/games/jusqua-la-mer/data/geo';

/** Rectangle en pixels de la carte. */
export type Rect = { left: number; top: number; right: number; bottom: number };

/** Étiquette placée : centre horizontal et ligne de base, en pixels de la carte. */
export type PlacedLabel = { id: string; text: string; x: number; baseline: number };

type LabelRequest = { id: string; text: string; lines: readonly Line[] };

/** Points essayés le long de la rivière, du milieu vers les extrémités. */
const ALONG = [0.5, 0.35, 0.65, 0.2, 0.8];
/** Largeur moyenne d'un caractère, en fraction de la taille de police (DM Sans gras). */
const CHAR_WIDTH = 0.58;

/**
 * Place le nom de chaque rivière près de son tracé, sans chevaucher une autre étiquette, les zones
 * à éviter (le médaillon) ni le bord de la carte. Une rivière sans place libre n'a pas d'étiquette.
 */
export function placeLabels(
  requests: readonly LabelRequest[],
  box: Box,
  width: number,
  height: number,
  fontSize: number,
  avoid: readonly Rect[] = [],
): PlacedLabel[] {
  const unitsPerPixel = (box.maxX - box.minX) / width;
  const taken: Rect[] = [...avoid];
  const placed: PlacedLabel[] = [];

  for (const { id, text, lines } of requests) {
    const line = longest(lines);
    if (!line) {
      continue;
    }
    const labelWidth = text.length * fontSize * CHAR_WIDTH + 6;
    const spot = candidates(line, box, unitsPerPixel, fontSize).find(({ x, baseline }) => {
      const rect = { left: x - labelWidth / 2, right: x + labelWidth / 2, top: baseline - fontSize, bottom: baseline + 3 };
      return inside(rect, width, height) && !taken.some((other) => overlaps(rect, other));
    });
    if (spot) {
      taken.push({ left: spot.x - labelWidth / 2, right: spot.x + labelWidth / 2, top: spot.baseline - fontSize, bottom: spot.baseline + 3 });
      placed.push({ id, text, ...spot });
    }
  }
  return placed;
}

function candidates(line: Line, box: Box, unitsPerPixel: number, fontSize: number) {
  return ALONG.flatMap((fraction) => {
    const [X, Y] = line[Math.min(line.length - 1, Math.round(fraction * (line.length - 1)))];
    const x = (X - box.minX) / unitsPerPixel;
    const y = (Y - box.minY) / unitsPerPixel;
    // Au-dessus du trait, puis au-dessous.
    return [
      { x, baseline: y - 6 },
      { x, baseline: y + fontSize + 6 },
    ];
  });
}

function longest(lines: readonly Line[]): Line | undefined {
  return [...lines].sort((a, b) => b.length - a.length)[0];
}

function inside(rect: Rect, width: number, height: number): boolean {
  return rect.left >= 2 && rect.top >= 2 && rect.right <= width - 2 && rect.bottom <= height - 2;
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}
