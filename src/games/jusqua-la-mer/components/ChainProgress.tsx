import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { dataset } from '@/games/jusqua-la-mer/data/rivers';
import {
  currentStepIndex,
  hintFor,
  isMistake,
  nextRequiredStepIndex,
  type GameState,
  type HistoryEntry,
} from '@/games/jusqua-la-mer/engine/game';
import { lastFoundId, missLabel, watercourseName } from '@/games/jusqua-la-mer/presentation';
import { capitalize } from '@/platform/text';
import { radius, spacing, useColors, useThemedStyles, type Palette } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Icon } from '@/platform/ui/Icon';

type Row = { key: string; id: string; misses: HistoryEntry[] };

/**
 * Le chemin parcouru : la rivière de départ, les étapes trouvées (avec les erreurs commises
 * en les cherchant), la case à trouver, puis la mer. Les étapes à venir restent cachées.
 */
export function ChainProgress({ state, onShowHint }: { state: GameState; onShowHint: () => void }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const steps = state.river.steps;
  const current = currentStepIndex(state);
  const mistakes = state.history.filter(
    (entry): entry is Extract<HistoryEntry, { at: number }> => entry.kind !== 'hint' && isMistake(entry.feedback),
  );

  // Une erreur s'affiche sous l'étape trouvée juste après elle.
  const rows: Row[] = [{ key: 'start', id: state.river.id, misses: [] }];
  let previous = -1;
  for (let i = 0; i < current; i++) {
    if (state.steps[i] === 'found') {
      rows.push({ key: `step-${i}`, id: steps[i].id, misses: mistakes.filter((m) => m.at > previous && m.at <= i) });
      previous = i;
    }
  }
  const pendingMisses = mistakes.filter((m) => m.at > previous);
  const required = nextRequiredStepIndex(state);
  const hint = hintFor(state, required === null ? { kind: 'sea' } : { kind: 'step', stepIndex: required });

  return (
    <View style={styles.card} accessibilityLabel="Ton parcours">
      {rows.map((row, index) => (
        <Animated.View key={row.key} entering={index === 0 ? undefined : FadeInDown.duration(350)} style={styles.row}>
          <View style={styles.rail}>
            {index === 0 ? (
              <View style={styles.startDot} />
            ) : (
              <View style={styles.foundDot}>
                <Icon name="check" size={16} color={colors.onWater} strokeWidth={2.6} />
              </View>
            )}
            <View style={styles.solidLine} />
          </View>
          <View style={styles.rowText}>
            <AppText variant="bodyStrong">{capitalize(watercourseName(row.id))}</AppText>
            {index === 0 ? (
              <AppText variant="caption" color={colors.inkMuted}>
                Départ
              </AppText>
            ) : null}
            <Misses entries={row.misses} state={state} />
          </View>
        </Animated.View>
      ))}

      <View style={styles.row}>
        <View style={styles.rail}>
          <View style={styles.pendingDot}>
            <AppText variant="bodyStrong" color={colors.water}>
              ?
            </AppText>
          </View>
          <View style={styles.dottedLine} />
        </View>
        <View style={[styles.rowText, styles.current]}>
          <AppText variant="bodyStrong" color={colors.water}>
            {required === null ? 'Et maintenant, la mer ?' : 'À toi de jouer'}
          </AppText>
          <AppText variant="caption" color={colors.inkSoft}>
            {capitalize(watercourseName(lastFoundId(state)))} se jette dans…
          </AppText>
          {hint ? (
            <Pressable accessibilityRole="button" onPress={onShowHint} style={styles.hintLink}>
              <Icon name="hint" size={14} color={colors.water} />
              <AppText variant="caption" color={colors.water}>
                Revoir l&apos;indice sur la carte
              </AppText>
            </Pressable>
          ) : null}
          <Misses entries={pendingMisses} state={state} />
        </View>
      </View>

      <View style={[styles.row, styles.endRow]}>
        <View style={styles.seaDot}>
          <Icon name="wave" size={18} color={colors.inkMuted} />
        </View>
        <AppText variant="small" color={colors.inkMuted}>
          … jusqu&apos;à la mer
        </AppText>
      </View>
    </View>
  );
}

function Misses({ entries, state }: { entries: HistoryEntry[]; state: GameState }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  if (entries.length === 0) {
    return null;
  }
  return (
    <View style={styles.misses}>
      {entries.map((entry, i) => {
        if (entry.kind === 'hint') {
          return null;
        }
        const name =
          entry.kind === 'sea' ? dataset.seas[entry.sea].shortName : capitalize(missLabel(entry.input, state));
        const note =
          entry.feedback.kind === 'downstream'
            ? ' — pas directement !'
            : entry.feedback.kind === 'sea-too-early'
              ? ' — pas encore !'
              : '';
        return (
          <View key={i} style={styles.miss}>
            <Icon name="close" size={14} color={colors.error} strokeWidth={2.6} />
            <AppText variant="caption" color={colors.error}>
              <AppText variant="caption" color={colors.error} style={styles.struck}>
                {name}
              </AppText>
              {note}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const DOT = 28;

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rail: {
    width: DOT,
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: spacing.lg,
    gap: 2,
  },
  current: {
    backgroundColor: colors.waterTint,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    marginTop: -4,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
  },
  startDot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.night,
    borderWidth: 7,
    borderColor: colors.waterSoft,
  },
  foundDot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.water,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: colors.water,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seaDot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidLine: {
    flex: 1,
    width: 3,
    minHeight: 12,
    marginVertical: 3,
    backgroundColor: colors.water,
  },
  dottedLine: {
    flex: 1,
    width: 0,
    minHeight: 12,
    marginVertical: 3,
    borderLeftWidth: 3,
    borderStyle: 'dotted',
    borderColor: colors.borderStrong,
  },
  endRow: {
    alignItems: 'center',
  },
  misses: {
    gap: 2,
    marginTop: spacing.xs,
  },
  miss: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  hintLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 32,
  },
});
