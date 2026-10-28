import { StyleSheet, View } from 'react-native';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { dataset } from '@/games/jusqua-la-mer/data/rivers';
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
import { placeLabels } from '@/games/jusqua-la-mer/components/map-labels';
import { colors, fonts, radius } from '@/platform/theme';

const SEA = '#CFE3F6';
/** Place réservée à droite pour le médaillon de la France, en pixels. */
const INSET_SPACE = 76;
const LABEL_SIZE = 11;

type RiverMapProps = {
  width: number;
  height: number;
  /** Cours d'eau déjà connus (le chemin parcouru), en bleu nuit. */
  known: readonly string[];
  /** Cours d'eau mis en avant (l'indice ou les étapes du trajet), en bleu vif. */
  highlight?: readonly string[];
  /** `france` : toute la France, comme une carte vierge ; `path` : zoom sur les tracés, avec la France en médaillon. */
  framing: 'france' | 'path';
  /** Écrit le nom des rivières (écran de résultat ; jamais sur une carte d'indice). */
  labels?: boolean;
  accessibilityLabel: string;
};

/** Carte vierge de la France avec des tracés de rivières (indices et écran de résultat). */
export function RiverMap({
  width,
  height,
  known,
  highlight = [],
  framing,
  labels = false,
  accessibilityLabel,
}: RiverMapProps) {
  const drawn = boundsOf([...known, ...highlight].flatMap((id) => watercourseLines(id) ?? []));
  const withInset = framing === 'path' && drawn !== null;
  const box = withInset ? fitWithInset(drawn, width, height) : fitBox(unionBox(franceBox, drawn), width / height, 0.04);
  // Largeur d'un pixel écran en unités de la carte, pour des traits d'épaisseur constante.
  const px = (box.maxX - box.minX) / width;
  const placed = labels
    ? placeLabels(
        [...known, ...highlight].map((id) => ({
          id,
          text: dataset.watercourses[id].name,
          lines: watercourseLines(id) ?? [],
        })),
        box,
        width,
        height,
        LABEL_SIZE,
        withInset ? [{ left: width - INSET_SPACE, top: height - INSET_SPACE, right: width, bottom: height }] : [],
      )
    : [];

  return (
    <View
      style={[styles.frame, { width, height }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}>
      <Svg width={width} height={height} viewBox={viewBox(box)}>
        <Rect x={box.minX} y={box.minY} width={box.maxX - box.minX} height={box.maxY - box.minY} fill={SEA} />
        <Outline px={px} />
        {known.map((id) => (
          <River key={id} id={id} color={colors.night} px={px} />
        ))}
        {highlight.map((id) => (
          <River key={id} id={id} color={colors.water} px={px} />
        ))}
        {placed.map((label) => (
          <G key={label.id}>
            {/* Le liseré blanc d'abord, puis le texte : le nom reste lisible sur les traits. */}
            {[true, false].map((halo) => (
              <SvgText
                key={String(halo)}
                x={box.minX + label.x * px}
                y={box.minY + label.baseline * px}
                fontSize={LABEL_SIZE * px}
                fontFamily={fonts.bodyBold}
                textAnchor="middle"
                fill={colors.ink}
                stroke={halo ? colors.white : 'none'}
                strokeWidth={halo ? 3 * px : 0}
                strokeLinejoin="round">
                {label.text}
              </SvgText>
            ))}
          </G>
        ))}
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
          strokeWidth={0.75 * px}
          strokeLinejoin="round"
        />
      ))}
    </G>
  );
}

/** Épaisseur d'un trait (en pixels) selon le rang du cours d'eau : un fleuve est plus épais qu'un affluent. */
export function riverStrokeWidth(lengthKm: number | undefined): number {
  const km = lengthKm ?? 50;
  if (km >= 500) {
    return 2.4;
  }
  if (km >= 200) {
    return 1.8;
  }
  if (km >= 80) {
    return 1.3;
  }
  return 1;
}

function River({ id, color, px }: { id: string; color: string; px: number }) {
  const lines = watercourseLines(id);
  if (!lines) {
    return null;
  }
  return (
    <Path
      d={lines.map((line: Line) => svgPath(line)).join('')}
      fill="none"
      stroke={color}
      strokeWidth={riverStrokeWidth(dataset.watercourses[id]?.lengthKm) * px}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
