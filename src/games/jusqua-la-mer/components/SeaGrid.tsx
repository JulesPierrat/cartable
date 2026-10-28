import { Pressable, StyleSheet, View } from 'react-native';

import { dataset, type SeaId } from '@/games/jusqua-la-mer/data/rivers';
import { seaName } from '@/games/jusqua-la-mer/presentation';
import { colors, radius, spacing, touchTarget } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Icon } from '@/platform/ui/Icon';

const order: SeaId[] = ['channel', 'north-sea', 'atlantic', 'mediterranean'];

/** Les quatre mers du jeu, en grille de 2 × 2. */
export function SeaGrid({ onPick }: { onPick: (sea: SeaId) => void }) {
  return (
    <View style={styles.grid}>
      {order.map((sea) => (
        <Pressable
          key={sea}
          accessibilityRole="button"
          accessibilityLabel={`Elle se jette dans ${seaName(sea)}`}
          onPress={() => onPick(sea)}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Icon name="wave" size={18} color={colors.water} />
          <AppText variant="bodyStrong" style={styles.label}>
            {dataset.seas[sea].shortName}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.waterTint,
  },
  label: {
    fontSize: 15,
  },
});
