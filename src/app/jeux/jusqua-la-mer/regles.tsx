import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Button } from '@/platform/ui/Button';
import { ComingSoon } from '@/platform/ui/ComingSoon';
import { IconButton } from '@/platform/ui/IconButton';
import { Screen } from '@/platform/ui/Screen';

export default function RulesScreen() {
  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color={colors.water}>
          Jusqu&apos;à la mer
        </AppText>
        <IconButton icon="close" accessibilityLabel="Fermer" onPress={() => router.back()} />
      </View>
      <View style={styles.intro}>
        <AppText variant="title" accessibilityRole="header">
          Comment jouer
        </AppText>
        <AppText color={colors.inkMuted}>
          Tout cours d&apos;eau finit par rejoindre la mer. À toi de retrouver son chemin, étape par
          étape.
        </AppText>
      </View>
      <ComingSoon
        phase="Phase 3"
        description="Les trois étapes illustrées (L'Aisne → L'Oise → La Seine → Manche) et le rappel des règles : 3 vies, indices, un défi par jour."
      />
      <View style={styles.footer}>
        <Button
          label="C'est parti"
          trailingIcon="arrowRight"
          onPress={() => router.push('/jeux/jusqua-la-mer/partie')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intro: {
    gap: spacing.sm,
  },
  footer: {
    marginTop: 'auto',
  },
});
