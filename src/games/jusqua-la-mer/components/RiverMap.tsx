import { StyleSheet, View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

import {
  boundsOf,
  fitBox,
  franceBox,
  franceOutline,
  svgPath,
  unionBox,
  watercourseLines,
  type Box,
  type Line,
} from '@/games/jusqua-la-mer/data/geo';
import { colors, radius } from '@/platform/theme';

const SEA = '#CFE3F6';
/** Place réservée à droite pour le médaillon de la France, en pixels. */
const INSET_SPACE = 76;

type RiverMapProps = {
  width: number;
  height: number;
  /** Cours d'eau déjà connus (le chemin parcouru), en bleu nuit. */
  known: readonly string[];
  /** Cours d'eau mis en avant (l'indice ou le trajet complet), en bleu vif et plus épais. */
  highlight?: readonly string[];
  /** `france` : toute la France, comme une carte vierge ; `path` : zoom sur les tracés, avec la France en médaillon. */
  framing: 'france' | 'path';
  accessibilityLabel: string;
};

/** Carte vierge de la France avec des tracés de rivières (indices et écran de résultat). */
export function RiverMap({ width, height, known, highlight = [], framing, accessibilityLabel }: RiverMapProps) {
  const knownLines = known.flatMap((id) => watercourseLines(id) ?? []);
  const highlightLines = highlight.flatMap((id) => watercourseLines(id) ?? []);
  const drawn = boundsOf([...knownLines, ...highlightLines]);
  const withInset = framing === 'path' && drawn !== null;
  const box = withInset ? fitWithInset(drawn, width, height) : fitBox(unionBox(franceBox, drawn), width / height, 0.04);
  // Largeur d'un pixel écran en unités de la carte, pour des traits d'épaisseur constante.
  const px = (box.maxX - box.minX) / width;

  return (
    <View
      style={[styles.frame, { width, height }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}>
      <Svg width={width} height={height} viewBox={viewBox(box)}>
        <Rect x={box.minX} y={box.minY} width={box.maxX - box.minX} height={box.maxY - box.minY} fill={SEA} />
        <Outline px={px} />
        <Lines lines={knownLines} color={colors.night} width={2.5 * px} halo={5 * px} />
        <Lines lines={highlightLines} color={colors.water} width={4 * px} halo={8 * px} />
      </Svg>
      {withInset ? <Inset box={box} /> : null}
    </View>
  );
}

function Outline({ px }: { px: number }) {
  return (
    <G>
      {franceOutline.map((ring, i) => (
        <Path
          key={i}
          d={svgPath(ring, true)}
          fill={colors.white}
          stroke={colors.borderStrong}
          strokeWidth={px}
          strokeLinejoin="round"
        />
      ))}
    </G>
  );
}

function Lines({ lines, color, width, halo }: { lines: readonly Line[]; color: string; width: number; halo: number }) {
  if (lines.length === 0) {
    return null;
  }
  const d = lines.map((line) => svgPath(line)).join('');
  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} stroke={colors.white} strokeWidth={halo} />
      <Path d={d} stroke={color} strokeWidth={width} />
    </G>
  );
}

/** La France en petit, avec le cadre de la vue zoomée. */
function Inset({ box }: { box: Box }) {
  const size = 58;
  const france = fitBox(franceBox, 1, 0.06);
  const px = (france.maxX - france.minX) / size;
  return (
    <View style={styles.inset} accessible={false}>
      <Svg width={size} height={size} viewBox={viewBox(france)}>
        {franceOutline.map((ring, i) => (
          <Path key={i} d={svgPath(ring, true)} fill={colors.surfaceMuted} stroke={colors.borderStrong} strokeWidth={px} />
        ))}
        <Rect
          x={box.minX}
          y={box.minY}
          width={box.maxX - box.minX}
          height={box.maxY - box.minY}
          fill={colors.water}
          fillOpacity={0.2}
          stroke={colors.water}
          strokeWidth={1.5 * px}
        />
      </Svg>
    </View>
  );
}

/** Cadre le trajet dans la partie gauche de la carte, pour que le médaillon ne le recouvre pas. */
function fitWithInset(drawn: Box, width: number, height: number): Box {
  const usable = width - INSET_SPACE;
  const box = fitBox(drawn, usable / height, 0.12, 600);
  return { ...box, maxX: box.maxX + ((box.maxX - box.minX) * INSET_SPACE) / usable };
}

function viewBox(box: Box): string {
  return `${box.minX} ${box.minY} ${box.maxX - box.minX} ${box.maxY - box.minY}`;
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: SEA,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inset: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    padding: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
