import {
  boundsOf,
  decodeLine,
  fitBox,
  franceBox,
  franceOutline,
  hasGeometry,
  svgPath,
  watercourseLines,
} from '@/games/jusqua-la-mer/data/geo';
import { dataset } from '@/games/jusqua-la-mer/data/rivers';

const idOf = (name: string) =>
  Object.entries(dataset.watercourses).find(([, watercourse]) => watercourse.name === name)![0];

describe('tracés de la carte', () => {
  it('décode les écarts successifs en points', () => {
    expect(decodeLine([10, 20, 1, -2, 3, 0])).toEqual([
      [10, 20],
      [11, 18],
      [14, 18],
    ]);
    expect(svgPath(decodeLine([10, 20, 1, -2]), true)).toBe('M10 20L11 18Z');
  });

  it('cadre une zone au rapport de la vue, avec une taille minimale', () => {
    const box = fitBox({ minX: 0, minY: 0, maxX: 100, maxY: 10 }, 2, 0, 0);
    expect(box.maxX - box.minX).toBe(100);
    expect(box.maxY - box.minY).toBe(50);
    const small = fitBox({ minX: 0, minY: 0, maxX: 1, maxY: 1 }, 1, 0, 600);
    expect(small.maxX - small.minX).toBe(600);
  });

  it('a le contour de la France, Corse comprise, à la bonne échelle', () => {
    expect(franceOutline.length).toBeGreaterThanOrEqual(2);
    // Environ 1 000 km d'ouest en est et du nord au sud, en hectomètres.
    expect(franceBox.maxX - franceBox.minX).toBeGreaterThan(9000);
    expect(franceBox.maxY - franceBox.minY).toBeGreaterThan(9000);
  });

  it('trace presque tous les cours d’eau français du jeu', () => {
    const french = Object.entries(dataset.watercourses).filter(([, w]) => w.sandreCode);
    const traced = french.filter(([id]) => hasGeometry(id));
    expect(traced.length / french.length).toBeGreaterThan(0.95);
  });

  it('place le Loir au sud-ouest de Paris, à l’intérieur de la France', () => {
    const loir = boundsOf(watercourseLines(idOf('Loir'))!)!;
    expect(loir.minX).toBeGreaterThan(franceBox.minX);
    expect(loir.maxY).toBeLessThan(franceBox.maxY);
    // Le Loir coule sur environ 150 km d'est en ouest.
    expect(loir.maxX - loir.minX).toBeGreaterThan(1000);
  });
});
