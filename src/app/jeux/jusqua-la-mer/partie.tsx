import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnswerPanel } from '@/games/jusqua-la-mer/components/AnswerPanel';
import { ChainProgress } from '@/games/jusqua-la-mer/components/ChainProgress';
import { HintCard } from '@/games/jusqua-la-mer/components/HintCard';
import { Lives } from '@/games/jusqua-la-mer/components/Lives';
import type { SeaId } from '@/games/jusqua-la-mer/data/rivers';
import {
  answerSea,
  answerWatercourse,
  DEFAULT_LIVES,
  currentHintTarget,
  hintFor,
  hintsFor,
  isMistake,
  MAX_HINTS,
  requestHint,
  type Feedback,
  type GameState,
  type Hint,
} from '@/games/jusqua-la-mer/engine/game';
import {
  difficultyLabels,
  feedbackMessage,
  gameContext,
  parseMode,
  watercourseName,
} from '@/games/jusqua-la-mer/presentation';
import { recordGame, saveDaily, startOrResume } from '@/games/jusqua-la-mer/progress';
import { useGameSession } from '@/games/jusqua-la-mer/session';
import { capitalize } from '@/platform/text';
import { spacing, useColors, useThemedStyles, type Palette } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { IconButton } from '@/platform/ui/IconButton';

/** Délai avant l'écran de résultat, pour laisser voir la dernière étape s'afficher. */
const RESULT_DELAY_MS = 700;

export default function GameScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  // Nouvelle partie, ou reprise du défi du jour : il reprend où on l'a laissé et ne se rejoue pas.
  const [start] = useState(() => startOrResume(parseMode(mode), new Date()));
  const { setup, startedAt, dateKey } = start;
  const [state, setState] = useState(start.state);
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const { finishGame } = useGameSession();

  useEffect(() => {
    if (state.status === 'playing' || start.finished) {
      return;
    }
    const finishedAt = Date.now();
    recordGame(setup, state, startedAt, finishedAt, dateKey);
    const timer = setTimeout(() => {
      finishGame({ setup, state, durationMs: finishedAt - startedAt });
      router.replace('/jeux/jusqua-la-mer/resultat');
    }, RESULT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, start.finished, setup, finishGame, startedAt, dateKey]);

  /** Nouvel état de la partie ; le défi du jour est sauvegardé à chaque coup. */
  const commit = (next: GameState) => {
    setState(next);
    if (setup.mode === 'daily') {
      saveDaily({
        dateKey,
        number: setup.dailyNumber!,
        riverId: setup.river.id,
        state: next,
        startedAt,
        finishedAt: next.status === 'playing' ? undefined : Date.now(),
      });
    }
  };

  const applyOutcome = (next: GameState, feedback: Feedback, input: string) => {
    commit(next);
    setMessage(textFor(feedback, input, next));
    if (isMistake(feedback)) {
      setShakeKey((key) => key + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (feedback.kind === 'found' || feedback.kind === 'sea-correct') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const onAnswer = (input: string): 'keep' | 'clear' => {
    const { state: next, feedback } = answerWatercourse(state, input, gameContext);
    applyOutcome(next, feedback, input);
    // Une saisie inconnue reste dans le champ, pour la corriger.
    return feedback.kind === 'unknown' ? 'keep' : 'clear';
  };

  const onSea = (sea: SeaId) => {
    const { state: next, feedback } = answerSea(state, sea);
    applyOutcome(next, feedback, '');
  };

  // L'indice de l'étape en cours, s'il a déjà été donné : il se revoit sans être payé une seconde fois.
  const hintTarget = currentHintTarget(state);
  const currentHint: Hint | undefined = hintFor(state, hintTarget);
  const moreHints = hintsFor(state, hintTarget).length < MAX_HINTS[hintTarget.kind];

  const showHint = () => {
    Keyboard.dismiss();
    setHintOpen(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  /** Indice suivant de l'étape en cours (le 1er, puis le 2e), contre une vie. */
  const takeHint = () => {
    const { state: next, hint, refusal } = requestHint(state, gameContext);
    if (hint) {
      commit(next);
      setMessage({ text: `${hint.level === 1 ? '1er' : '2e'} indice : une vie en moins.`, tone: 'info' });
      Haptics.selectionAsync();
      showHint();
    } else if (refusal === 'all-given') {
      showHint();
    } else if (refusal === 'last-life') {
      setMessage({ text: 'Il te faut au moins deux vies pour demander un indice.', tone: 'info' });
    }
  };

  // L'ampoule rouvre l'indice déjà pris (gratuit) ; le 2e indice se demande depuis la carte.
  const onHint = () => (currentHint ? showHint() : takeHint());

  if (start.finished) {
    return <Redirect href="/jeux/jusqua-la-mer/resultat" />;
  }

  const title = setup.mode === 'daily' ? 'Défi du jour' : `Partie libre · ${difficultyLabels[setup.mode]}`;
  const subtitle = setup.mode === 'daily' ? `n°${setup.dailyNumber} · Jusqu'à la mer` : "Jusqu'à la mer";

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <IconButton icon="close" accessibilityLabel="Quitter la partie" onPress={() => router.dismissAll()} />
            <View style={styles.headerTitle}>
              <AppText variant="bodyStrong">{title}</AppText>
              <AppText variant="caption" color={colors.inkMuted}>
                {subtitle}
              </AppText>
            </View>
            <IconButton icon="hint" accessibilityLabel="Demander un indice" color={colors.water} onPress={onHint} />
          </View>

          <View style={styles.prompt}>
            <View style={styles.promptText}>
              <AppText variant="label" color={colors.water}>
                {setup.mode === 'daily' ? 'Rivière du jour' : 'Rivière de départ'}
              </AppText>
              <AppText variant="display" accessibilityRole="header">
                {capitalize(watercourseName(setup.river.id))}
              </AppText>
            </View>
            <Lives left={state.livesLeft} total={DEFAULT_LIVES} />
          </View>

          {hintOpen && currentHint ? (
            <HintCard
              hint={currentHint}
              state={state}
              onHide={() => setHintOpen(false)}
              onNextHint={moreHints ? (state.livesLeft > 1 ? takeHint : null) : undefined}
            />
          ) : null}
          <ChainProgress state={state} onShowHint={showHint} />
        </ScrollView>

        <AnswerPanel onAnswer={onAnswer} onSea={onSea} message={message} shakeKey={shakeKey} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function textFor(feedback: Feedback, input: string, state: GameState) {
  const text = feedbackMessage(feedback, input, state);
  if (!text) {
    return null;
  }
  return { text, tone: isMistake(feedback) ? ('error' as const) : ('info' as const) };
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    alignItems: 'center',
  },
  prompt: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  promptText: {
    flex: 1,
    gap: spacing.xs,
  },
});
