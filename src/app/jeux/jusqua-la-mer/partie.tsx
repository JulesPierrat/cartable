import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnswerPanel } from '@/games/jusqua-la-mer/components/AnswerPanel';
import { ChainProgress } from '@/games/jusqua-la-mer/components/ChainProgress';
import { Lives } from '@/games/jusqua-la-mer/components/Lives';
import type { SeaId } from '@/games/jusqua-la-mer/data/rivers';
import {
  answerSea,
  answerWatercourse,
  DEFAULT_LIVES,
  isMistake,
  requestHint,
  startGame,
  type Feedback,
  type GameState,
} from '@/games/jusqua-la-mer/engine/game';
import {
  difficultyLabels,
  feedbackMessage,
  gameContext,
  hintText,
  parseMode,
  setupGame,
  watercourseName,
} from '@/games/jusqua-la-mer/presentation';
import { useGameSession } from '@/games/jusqua-la-mer/session';
import { capitalize } from '@/platform/text';
import { colors, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { IconButton } from '@/platform/ui/IconButton';

/** Délai avant l'écran de résultat, pour laisser voir la dernière étape s'afficher. */
const RESULT_DELAY_MS = 700;

export default function GameScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [setup] = useState(() => setupGame(parseMode(mode)));
  const [state, setState] = useState(() => startGame(setup.river));
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const { finishGame } = useGameSession();

  useEffect(() => {
    if (state.status === 'playing') {
      return;
    }
    const timer = setTimeout(() => {
      finishGame({ setup, state, durationMs: Date.now() - startedAt });
      router.replace('/jeux/jusqua-la-mer/resultat');
    }, RESULT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, setup, finishGame, startedAt]);

  const applyOutcome = (next: GameState, feedback: Feedback, input: string) => {
    setState(next);
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

  const onHint = () => {
    const { state: next, hint } = requestHint(state, gameContext);
    if (hint) {
      setState(next);
      setMessage({ text: `Indice : ${hintText(hint, setup.river)}.`, tone: 'info' });
      Haptics.selectionAsync();
    } else {
      setMessage({ text: 'Tu as déjà ton indice pour cette étape.', tone: 'info' });
    }
  };

  const title = setup.mode === 'daily' ? 'Défi du jour' : `Partie libre · ${difficultyLabels[setup.mode]}`;
  const subtitle = setup.mode === 'daily' ? `n°${setup.dailyNumber} · Jusqu'à la mer` : "Jusqu'à la mer";

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
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

          <ChainProgress state={state} />
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

const styles = StyleSheet.create({
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
