import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { dataset, type Difficulty } from '@/games/jusqua-la-mer/data/rivers';
import { dailyChallenge } from '@/games/jusqua-la-mer/engine/challenges';
import { difficultyLabels } from '@/games/jusqua-la-mer/presentation';
import { localDateKey } from '@/platform/daily';
import { availableGames, upcomingGames, type AvailableGame } from '@/platform/games';
import { colors, radius, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Button } from '@/platform/ui/Button';
import { Icon } from '@/platform/ui/Icon';
import { Logo } from '@/platform/ui/Logo';
import { Screen } from '@/platform/ui/Screen';

const levels: { difficulty: Difficulty; description: string; drops: number }[] = [
  { difficulty: 'easy', description: 'Grands fleuves', drops: 1 },
  { difficulty: 'medium', description: 'Rivières connues', drops: 2 },
  { difficulty: 'hard', description: 'Petits affluents', drops: 3 },
];

export default function HomeScreen() {
  const [dailyGame] = availableGames;

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Logo />
        </View>

        {dailyGame ? <DailyCard game={dailyGame} /> : null}

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <AppText variant="heading" accessibilityRole="header">
              Partie libre
            </AppText>
            <AppText variant="caption" color={colors.inkMuted}>
              Sans limite, à ton rythme
            </AppText>
          </View>
          <View style={styles.levels}>
            {levels.map(({ difficulty, description, drops }) => (
              <Pressable
                key={difficulty}
                accessibilityRole="button"
                accessibilityLabel={`Partie libre, niveau ${difficultyLabels[difficulty]} : ${description}`}
                onPress={() => router.push({ pathname: '/jeux/jusqua-la-mer/partie', params: { mode: difficulty } })}
                style={({ pressed }) => [styles.level, pressed && styles.levelPressed]}>
                <View style={styles.drops}>
                  {[1, 2, 3].map((n) =>
                    n <= drops ? (
                      <Icon key={n} name="droplet" size={14} color={colors.water} filled />
                    ) : (
                      <Icon key={n} name="droplet" size={14} color={colors.borderStrong} />
                    ),
                  )}
                </View>
                <View>
                  <AppText variant="bodyStrong">{difficultyLabels[difficulty]}</AppText>
                  <AppText variant="caption" color={colors.inkMuted}>
                    {description}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {upcomingGames.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="heading" accessibilityRole="header">
              Bientôt sur Cartable
            </AppText>
            <View style={styles.upcomingGrid}>
              {upcomingGames.map((game) => (
                <View key={game.id} style={styles.upcomingCard}>
                  <View style={styles.upcomingTitle}>
                    <Icon name="lock" size={16} color={colors.inkSoft} />
                    <AppText variant="bodyStrong" color={colors.inkSoft}>
                      {game.title}
                    </AppText>
                  </View>
                  <AppText variant="caption" color={colors.inkMuted}>
                    {game.tagline}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function DailyCard({ game }: { game: AvailableGame }) {
  const today = new Date();
  const { number } = dailyChallenge(dataset, localDateKey(today));
  const date = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <View style={styles.dailyCard}>
      <View style={styles.dailyTop}>
        <View style={styles.dailyBadge}>
          <AppText variant="label" color={colors.white}>
            Défi du jour
          </AppText>
        </View>
        <AppText variant="caption" color={colors.nightText}>
          n°{number} · {date}
        </AppText>
      </View>
      <AppText variant="display" color={colors.white} accessibilityRole="header">
        {game.title}
      </AppText>
      <AppText variant="body" color={colors.nightText}>
        {game.tagline}
      </AppText>
      <AppText variant="small" color={colors.nightText}>
        ≈ {game.estimatedMinutes} min · {game.lives} vies
      </AppText>
      <Button
        label="Jouer le défi"
        icon="play"
        variant="light"
        onPress={() => router.push({ pathname: '/jeux/jusqua-la-mer/regles', params: { mode: 'daily' } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  header: {
    minHeight: 44,
    justifyContent: 'center',
  },
  dailyCard: {
    backgroundColor: colors.night,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  dailyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  levels: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  level: {
    flex: 1,
    minHeight: 100,
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelPressed: {
    backgroundColor: colors.waterTint,
  },
  drops: {
    flexDirection: 'row',
    gap: 3,
  },
  upcomingGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  upcomingCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  upcomingTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
