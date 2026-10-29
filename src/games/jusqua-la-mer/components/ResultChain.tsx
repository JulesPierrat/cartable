import { StyleSheet, View } from 'react-native';

import { dataset, type River } from '@/games/jusqua-la-mer/data/rivers';
import type { GameState } from '@/games/jusqua-la-mer/engine/game';
import { watercourseName } from '@/games/jusqua-la-mer/presentation';
import { capitalize } from '@/platform/text';
import { fonts, radius, spacing, useColors, useThemedStyles, type Palette } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Icon } from '@/platform/ui/Icon';

/**
 * Le chemin complet en pastilles. Une étape facultative que le joueur n'a pas citée
 * apparaît en pointillés, pour qu'il la découvre sans qu'elle compte comme un oubli.
 */
export function ResultChain({ river, state }: { river: River; state: GameState }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const items = [
    { key: 'start', label: capitalize(watercourseName(river.id)), dashed: false },
    ...river.steps.map((step, i) => ({
      key: `step-${i}`,
      label: capitalize(watercourseName(step.id)),
      dashed: Boolean(step.optional) && state.steps[i] !== 'found',
    })),
  ];
  return (
    <View style={styles.row} accessibilityLabel="Le chemin complet">
      {items.map((item) => (
        <View key={item.key} style={styles.item}>
          <View style={[styles.pill, item.dashed && styles.dashed]}>
            <AppText variant="small" color={colors.night} style={styles.pillText}>
              {item.label}
              {item.dashed ? ' (facultatif)' : ''}
            </AppText>
          </View>
          <Icon name="chevronRight" size={14} color={colors.inkMuted} strokeWidth={2.4} />
        </View>
      ))}
      <View style={[styles.pill, styles.sea]}>
        <Icon name="wave" size={16} color={colors.white} />
        <AppText variant="small" color={colors.white} style={styles.pillText}>
          {capitalize(dataset.seas[river.sea].name)}
        </AppText>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.waterSoft,
  },
  dashed: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.water,
  },
  sea: {
    backgroundColor: colors.hero,
  },
  pillText: {
    fontFamily: fonts.bodyBold,
  },
});
