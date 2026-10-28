import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';

type ComingSoonProps = {
  /** Phase du plan (`docs/plan-alpha.md`) qui remplira cet écran. */
  phase: string;
  description: string;
};

/** Encadré provisoire pour les écrans pas encore construits. */
export function ComingSoon({ phase, description }: ComingSoonProps) {
  return (
    <View style={styles.box}>
      <AppText variant="label" color={colors.water}>
        {phase}
      </AppText>
      <AppText variant="small" color={colors.inkSoft}>
        {description}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
});
