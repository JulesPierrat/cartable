import { Redirect, router } from 'expo-router';
import { ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ResultChain } from '@/games/jusqua-la-mer/components/ResultChain';
import { RiverMap } from '@/games/jusqua-la-mer/components/RiverMap';
import { ResultGrid } from '@/games/jusqua-la-mer/components/ResultGrid';
import { gameGrid, mistakeCount, score } from '@/games/jusqua-la-mer/engine/game';
import {
  difficultyLabels,
  plural,
  riverFact,
  victoryTitles,
  type GameSetup,
} from '@/games/jusqua-la-mer/presentation';
import { useGameSession } from '@/games/jusqua-la-mer/session';
import { formatDuration, shareGrid, timeUntilMidnight } from '@/platform/share';
import { colors, radius, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Button } from '@/platform/ui/Button';
import { Icon } from '@/platform/ui/Icon';
import { IconButton } from '@/platform/ui/IconButton';

export default function ResultScreen() {
  const { lastGame } = useGameSession();
  const { width } = useWindowDimensions();
  if (!lastGame) {
    return <Redirect href="/" />;
  }
  const { setup, state, durationMs } = lastGame;
  const won = state.status === 'won';
  const grid = gameGrid(state);
  const required = setup.river.steps.filter((step) => !step.optional).length;
  const fact = riverFact(setup.river);

  const share = () => {
    const header = setup.mode === 'daily' ? `Cartable · Jusqu'à la mer n°${setup.dailyNumber}` : "Cartable · Jusqu'à la mer";
    const outcome = won ? `${score(state)}/100` : 'perdu cette fois';
    Share.share({ message: `${header}\n${shareGrid(grid)}\n${outcome}` });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="label" color={won ? colors.water : colors.error}>
              {label(setup, won)}
            </AppText>
            <AppText variant="title" accessibilityRole="header">
              {won ? victoryTitles[setup.river.sea] : 'Perdu, cette fois…'}
            </AppText>
            <AppText variant="body" color={colors.inkMuted}>
              {required > 0 ? plural(required, 'étape') : 'Directement à la mer'} ·{' '}
              {plural(mistakeCount(state), 'erreur')} · {formatDuration(durationMs)}
            </AppText>
          </View>
          <IconButton icon="close" accessibilityLabel="Fermer" onPress={() => router.dismissAll()} />
        </View>

        {won ? null : (
          <AppText color={colors.inkSoft}>Voici le chemin complet, pour la prochaine fois :</AppText>
        )}
        <ResultChain river={setup.river} state={state} />

        <RiverMap
          width={Math.min(width, 480) - 2 * spacing.xxl}
          height={(Math.min(width, 480) - 2 * spacing.xxl) / 1.6}
          framing="path"
          known={[setup.river.id]}
          highlight={setup.river.steps.map((step) => step.id)}
          accessibilityLabel="Carte du trajet jusqu'à la mer"
        />

        <View style={styles.scoreCard}>
          <View style={styles.scoreGrid}>
            <AppText variant="caption" color={colors.inkMuted}>
              Ta partie
            </AppText>
            <ResultGrid cells={grid} />
          </View>
          <View style={styles.scoreValue}>
            <AppText variant="caption" color={colors.inkMuted}>
              Score
            </AppText>
            <AppText variant="heading" color={colors.night}>
              {score(state)}/100
            </AppText>
          </View>
        </View>

        {fact ? (
          <View style={styles.fact}>
            <View style={styles.factTitle}>
              <Icon name="hint" size={18} color={colors.night} />
              <AppText variant="bodyStrong" color={colors.night}>
                Le saviez-vous ?
              </AppText>
            </View>
            <AppText variant="small">{fact}</AppText>
          </View>
        ) : null}

        <View style={styles.actions}>
          <View style={styles.action}>
            <Button label="Partager" icon="share" onPress={share} />
          </View>
          <View style={styles.action}>
            <Button
              label="Partie libre"
              variant="secondary"
              onPress={() =>
                router.replace({
                  pathname: '/jeux/jusqua-la-mer/partie',
                  params: { mode: setup.mode === 'daily' ? 'medium' : setup.mode },
                })
              }
            />
          </View>
        </View>

        {setup.mode === 'daily' ? (
          <AppText variant="small" color={colors.inkMuted} style={styles.countdown}>
            Prochain défi dans {timeUntilMidnight(new Date())}
          </AppText>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function label(setup: GameSetup, won: boolean): string {
  if (setup.mode === 'daily') {
    return won ? 'Défi du jour réussi' : 'Défi du jour';
  }
  return `Partie libre · ${difficultyLabels[setup.mode]}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
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
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreGrid: {
    flex: 1,
    gap: spacing.sm,
  },
  scoreValue: {
    alignItems: 'flex-end',
  },
  fact: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.waterTint,
    gap: spacing.xs,
  },
  factTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  action: {
    flex: 1,
  },
  countdown: {
    textAlign: 'center',
  },
});
