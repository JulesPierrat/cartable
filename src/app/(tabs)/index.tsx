import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { availableGames, upcomingGames, type AvailableGame } from '@/platform/games';
import { colors, radius, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Button } from '@/platform/ui/Button';
import { Icon } from '@/platform/ui/Icon';
import { Logo } from '@/platform/ui/Logo';
import { Screen } from '@/platform/ui/Screen';

export default function HomeScreen() {
  const [dailyGame] = availableGames;

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Logo />
        </View>

        {dailyGame ? <DailyCard game={dailyGame} /> : null}

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
  return (
    <View style={styles.dailyCard}>
      <View style={styles.dailyBadge}>
        <AppText variant="label" color={colors.white}>
          Défi du jour
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
      <Button label="Jouer le défi" icon="play" variant="light" onPress={() => router.push(game.entry)} />
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
  dailyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  section: {
    gap: spacing.md,
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
