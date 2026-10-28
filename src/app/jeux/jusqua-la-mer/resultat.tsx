import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Button } from '@/platform/ui/Button';
import { ComingSoon } from '@/platform/ui/ComingSoon';
import { IconButton } from '@/platform/ui/IconButton';
import { Screen } from '@/platform/ui/Screen';

export default function ResultScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="label" color={colors.water}>
            Défi du jour réussi
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            Jusqu&apos;à l&apos;océan !
          </AppText>
        </View>
        <IconButton icon="close" accessibilityLabel="Fermer" onPress={() => router.dismissAll()} />
      </View>
      <ComingSoon
        phase="Phases 4 et 5"
        description="La carte du trajet, la grille de la partie, la série de jours, une anecdote et le partage."
      />
      <View style={styles.footer}>
        <Button label="Retour à l'accueil" onPress={() => router.dismissAll()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  footer: {
    marginTop: 'auto',
  },
});
