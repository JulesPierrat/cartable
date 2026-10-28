import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';

/** Logo Cartable : une carte pliée dans un carré bleu, suivie du nom. */
export function Logo() {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Cartable">
      <Svg width={34} height={34} viewBox="0 0 34 34">
        <Rect width={34} height={34} rx={10} fill={colors.water} />
        <Path
          d="M8 10l6-2 6 2 6-2v16l-6 2-6-2-6 2z M14 8v16 M20 10v16"
          fill="none"
          stroke={colors.white}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </Svg>
      <AppText variant="title" style={styles.name}>
        Cartable
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  name: {
    fontSize: 26,
    lineHeight: 30,
  },
});
