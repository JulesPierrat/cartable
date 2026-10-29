import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { plural } from '@/games/jusqua-la-mer/presentation';
import { GAME_ID } from '@/games/jusqua-la-mer/progress';
import { localDateKey } from '@/platform/daily';
import { dailyStreaks, gameStats, useRecords } from '@/platform/records';
import { radius, spacing, useColors, useThemedStyles, type Palette } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Screen, useTabBarSpace } from '@/platform/ui/Screen';

export default function StatsScreen() {
  const tabBarSpace = useTabBarSpace();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [today] = useState(() => localDateKey(new Date()));
  const records = useRecords(GAME_ID);
  const stats = gameStats(records);
  const streaks = dailyStreaks(records, today);
  const dailyCount = records.filter((record) => record.mode === 'daily').length;

  const rows = [
    { label: 'Sans faute', count: stats.wonByLivesLost[0], muted: false },
    { label: '1 vie perdue', count: stats.wonByLivesLost[1], muted: false },
    { label: '2 vies perdues', count: stats.wonByLivesLost[2], muted: false },
    { label: 'Perdues', count: stats.lost, muted: true },
  ];
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: tabBarSpace }]} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <AppText variant="title" accessibilityRole="header">
            Stats
          </AppText>
          <AppText color={colors.inkMuted}>Jusqu&apos;à la mer</AppText>
        </View>

        <View style={styles.tiles}>
          <Tile
            value={String(stats.played)}
            label={stats.played > 1 ? 'parties' : 'partie'}
            detail={`dont ${plural(dailyCount, 'défi')} du jour`}
          />
          <Tile value={`${stats.winRate} %`} label="réussies" />
          <Tile value={String(streaks.current)} label={streaks.current > 1 ? 'jours de série' : 'jour de série'} />
          <Tile value={String(streaks.best)} label={streaks.best > 1 ? 'jours au record' : 'jour au record'} />
        </View>

        {stats.played === 0 ? (
          <View style={styles.card}>
            <AppText color={colors.inkSoft}>Joue ton premier défi pour voir tes stats ici.</AppText>
          </View>
        ) : (
          <View style={styles.card} accessibilityLabel="Répartition des parties">
            <AppText variant="bodyStrong">Tes parties</AppText>
            {rows.map((row) => (
              <View key={row.label} style={styles.row} accessible accessibilityLabel={`${row.label} : ${row.count}`}>
                <AppText variant="small" color={colors.inkSoft} style={styles.rowLabel}>
                  {row.label}
                </AppText>
                <View style={styles.track}>
                  {row.count > 0 ? (
                    <View
                      style={[
                        styles.bar,
                        { width: `${(100 * row.count) / max}%`, backgroundColor: row.muted ? colors.borderStrong : colors.water },
                      ]}
                    />
                  ) : null}
                </View>
                <AppText variant="small" color={colors.ink} style={styles.count}>
                  {row.count}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Tile({ value, label, detail }: { value: string; label: string; detail?: string }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${value} ${label}${detail ? `, ${detail}` : ''}`}>
      <AppText variant="title" color={colors.night}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.inkMuted}>
        {label}
      </AppText>
      {detail ? (
        <AppText variant="caption" color={colors.inkMuted}>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  scroll: {
    gap: spacing.xl,

  },
  intro: {
    gap: spacing.xs,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexBasis: '45%',
    flexGrow: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: {
    width: 104,
  },
  track: {
    flex: 1,
    height: 12,
  },
  bar: {
    height: 12,
    minWidth: 6,
    borderRadius: 4,
  },
  count: {
    width: 28,
    textAlign: 'right',
  },
});
