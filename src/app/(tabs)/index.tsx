import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { dataset, type Difficulty } from '@/games/jusqua-la-mer/data/rivers';
import { dailyChallenge } from '@/games/jusqua-la-mer/engine/challenges';
import { difficultyLabels, plural, type GameMode } from '@/games/jusqua-la-mer/presentation';
import { GAME_ID, useDailySave, useRulesSeen } from '@/games/jusqua-la-mer/progress';
import { localDateKey } from '@/platform/daily';
import { availableGames, upcomingGames, type AvailableGame } from '@/platform/games';
import { dailyStreaks, useRecords } from '@/platform/records';
import { radius, spacing, useColors, useThemedStyles, type Palette } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Button } from '@/platform/ui/Button';
import { Icon } from '@/platform/ui/Icon';
import { Logo } from '@/platform/ui/Logo';
import { Screen, useTabBarSpace } from '@/platform/ui/Screen';

const levels: { difficulty: Difficulty; description: string; drops: number }[] = [
  { difficulty: 'easy', description: 'Grands fleuves', drops: 1 },
  { difficulty: 'medium', description: 'Rivières connues', drops: 2 },
  { difficulty: 'hard', description: 'Petits affluents', drops: 3 },
];

/** Ouvre une partie, en passant par les règles tant qu'elles n'ont jamais été lues. */
function play(mode: GameMode, rulesSeen: boolean) {
  router.push({ pathname: rulesSeen ? '/jeux/jusqua-la-mer/partie' : '/jeux/jusqua-la-mer/regles', params: { mode } });
}

export default function HomeScreen() {
  const tabBarSpace = useTabBarSpace();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [dailyGame] = availableGames;
  const [today] = useState(() => localDateKey(new Date()));
  const streak = dailyStreaks(useRecords(GAME_ID), today).current;
  const rulesSeen = useRulesSeen();

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: tabBarSpace }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Logo />
          {streak > 0 ? (
            <View style={styles.streak} accessible accessibilityLabel={`Série de ${plural(streak, 'jour')}`}>
              <Icon name="droplet" size={18} color={colors.water} filled />
              <AppText variant="bodyStrong" color={colors.night}>
                {plural(streak, 'jour')}
              </AppText>
            </View>
          ) : null}
        </View>

        {dailyGame ? <DailyCard game={dailyGame} today={today} rulesSeen={rulesSeen} /> : null}

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
                onPress={() => play(difficulty, rulesSeen)}
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

function DailyCard({ game, today, rulesSeen }: { game: AvailableGame; today: string; rulesSeen: boolean }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { number } = dailyChallenge(dataset, today);
  const date = new Date(`${today}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const save = useDailySave(today);
  const finished = save?.finishedAt !== undefined;
  const won = save?.state.status === 'won';

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
      {finished ? (
        <View style={styles.dailyDone}>
          <Icon name={won ? 'check' : 'close'} size={18} color={colors.white} strokeWidth={2.6} />
          <AppText variant="bodyStrong" color={colors.white}>
            {won ? 'Défi réussi' : 'Défi raté'} : reviens demain pour le suivant
          </AppText>
        </View>
      ) : null}
      <Button
        label={finished ? 'Voir mon résultat' : save ? 'Reprendre le défi' : 'Jouer le défi'}
        icon={finished ? undefined : 'play'}
        variant="light"
        onPress={() => (finished ? router.push('/jeux/jusqua-la-mer/resultat') : play('daily', rulesSeen))}
      />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  scroll: {
    gap: spacing.xxl,

  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingLeft: spacing.sm + 2,
    paddingRight: spacing.md + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.waterSoft,
  },
  dailyDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dailyCard: {
    backgroundColor: colors.hero,
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
