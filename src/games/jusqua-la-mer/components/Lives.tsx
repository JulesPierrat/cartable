import { StyleSheet, View } from 'react-native';

import { colors } from '@/platform/theme';
import { Icon } from '@/platform/ui/Icon';

/** Les vies : des gouttes pleines pour celles qui restent, vides pour celles perdues. */
export function Lives({ left, total }: { left: number; total: number }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${left} vie${left > 1 ? 's' : ''} sur ${total}`}>
      {Array.from({ length: total }, (_, i) =>
        i < left ? (
          <Icon key={i} name="droplet" size={22} color={colors.water} filled />
        ) : (
          <Icon key={i} name="droplet" size={22} color={colors.borderStrong} />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
});
