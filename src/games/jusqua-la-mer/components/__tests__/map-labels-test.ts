import { placeLabels } from '@/games/jusqua-la-mer/components/map-labels';
import type { Line } from '@/games/jusqua-la-mer/data/geo';

// Une carte de 200 × 100 pixels qui montre 200 × 100 unités : 1 unité = 1 pixel.
const box = { minX: 0, minY: 0, maxX: 200, maxY: 100 };
const horizontal = (y: number): Line => Array.from({ length: 11 }, (_, i) => [i * 20, y] as const);

describe('étiquettes de la carte', () => {
  it('pose le nom au-dessus du milieu de la rivière', () => {
    const [label] = placeLabels([{ id: 'a', text: 'Loir', lines: [horizontal(50)] }], box, 200, 100, 10);
    expect(label).toEqual({ id: 'a', text: 'Loir', x: 100, baseline: 44 });
  });

  it('décale une étiquette qui chevaucherait la précédente', () => {
    const labels = placeLabels(
      [
        { id: 'a', text: 'Loir', lines: [horizontal(50)] },
        { id: 'b', text: 'Sarthe', lines: [horizontal(52)] },
      ],
      box,
      200,
      100,
      10,
    );
    expect(labels).toHaveLength(2);
    expect(labels[1]).not.toEqual(expect.objectContaining({ x: 100, baseline: 46 }));
  });

  it('évite les zones réservées et renonce faute de place', () => {
    const everywhere = [{ left: 0, top: 0, right: 200, bottom: 100 }];
    expect(placeLabels([{ id: 'a', text: 'Loir', lines: [horizontal(50)] }], box, 200, 100, 10, everywhere)).toEqual([]);
  });
});
