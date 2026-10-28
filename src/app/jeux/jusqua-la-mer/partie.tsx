import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { dataset, withArticle } from '@/games/jusqua-la-mer/data/rivers';
import { dailyChallenge } from '@/games/jusqua-la-mer/engine/challenges';
import { localDateKey } from '@/platform/daily';
import { capitalize } from '@/platform/text';
import { colors, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Button } from '@/platform/ui/Button';
import { ComingSoon } from '@/platform/ui/ComingSoon';
import { IconButton } from '@/platform/ui/IconButton';
import { Screen } from '@/platform/ui/Screen';

export default function GameScreen() {
  const daily = dailyChallenge(dataset, localDateKey(new Date()));
  const riverName = capitalize(withArticle(dataset.watercourses[daily.river.id]));

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="close" accessibilityLabel="Quitter la partie" onPress={() => router.dismissAll()} />
        <View style={styles.headerTitle}>
          <AppText variant="bodyStrong">Défi du jour</AppText>
          <AppText variant="caption" color={colors.inkMuted}>
            n°{daily.number} · Jusqu&apos;à la mer
          </AppText>
        </View>
        <IconButton icon="hint" accessibilityLabel="Demander un indice" color={colors.water} onPress={() => {}} />
      </View>
      <View style={styles.prompt}>
        <AppText variant="label" color={colors.water}>
          Rivière du jour
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          {riverName}
        </AppText>
      </View>
      <ComingSoon
        phase="Phase 3"
        description="La chaîne des cours d'eau trouvés, les vies, la saisie avec suggestions et le choix de la mer. Le moteur de jeu (phase 2) est prêt."
      />
      <View style={styles.footer}>
        <Button
          label="Voir le résultat (provisoire)"
          variant="secondary"
          onPress={() => router.replace('/jeux/jusqua-la-mer/resultat')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    alignItems: 'center',
  },
  prompt: {
    gap: spacing.xs,
  },
  footer: {
    marginTop: 'auto',
  },
});
