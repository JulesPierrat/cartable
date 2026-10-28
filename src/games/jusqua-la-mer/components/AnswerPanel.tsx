import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SeaGrid } from '@/games/jusqua-la-mer/components/SeaGrid';
import type { SeaId } from '@/games/jusqua-la-mer/data/rivers';
import { nameIndex } from '@/games/jusqua-la-mer/presentation';
import { suggest } from '@/platform/autocomplete';
import { colors, fonts, radius, spacing, touchTarget } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';

type AnswerPanelProps = {
  onAnswer: (input: string) => 'keep' | 'clear';
  onSea: (sea: SeaId) => void;
  message: { text: string; tone: 'error' | 'info' } | null;
  /** Change à chaque erreur : déclenche la secousse du champ de saisie. */
  shakeKey: number;
};

/**
 * Bas de l'écran de partie : suggestions, saisie, et choix de la mer. Clavier ouvert, les mers
 * sont remplacées par un lien qui le ferme, pour que la saisie et les suggestions restent visibles.
 */
export function AnswerPanel({ onAnswer, onSea, message, shakeKey }: AnswerPanelProps) {
  const [text, setText] = useState('');
  const keyboardVisible = useKeyboardVisible();
  const insets = useSafeAreaInsets();
  const suggestions = suggest(nameIndex, text, 3);

  const offset = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));
  useEffect(() => {
    if (shakeKey > 0) {
      offset.set(
        withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 70 }),
          withTiming(-6, { duration: 70 }),
          withTiming(6, { duration: 70 }),
          withTiming(0, { duration: 50 }),
        ),
      );
    }
  }, [shakeKey, offset]);

  const submit = (value: string) => {
    if (value.trim() === '') {
      return;
    }
    if (onAnswer(value) === 'clear') {
      setText('');
    }
  };

  return (
    <View style={[styles.sheet, { paddingBottom: keyboardVisible ? spacing.md : insets.bottom + spacing.lg }]}>
      {message ? (
        <AppText
          variant="small"
          color={message.tone === 'error' ? colors.error : colors.night}
          accessibilityLiveRegion="polite"
          style={styles.message}>
          {message.text}
        </AppText>
      ) : null}

      {suggestions.length > 0 ? (
        <View style={styles.suggestions} accessibilityLabel="Suggestions">
          {suggestions.map((name) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              onPress={() => submit(name)}
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
              <AppText variant="bodyStrong" color={colors.night} style={styles.chipText}>
                {name}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.field}>
        <AppText variant="caption" color={colors.inkMuted} nativeID="reponse-label">
          Ta réponse
        </AppText>
        <Animated.View style={[styles.inputRow, shakeStyle]}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => submit(text)}
            placeholder="Nom du cours d'eau"
            placeholderTextColor={colors.inkMuted}
            accessibilityLabelledBy="reponse-label"
            accessibilityLabel="Ta réponse"
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="send"
            submitBehavior="submit"
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => submit(text)}
            style={({ pressed }) => [styles.validate, pressed && { opacity: 0.85 }]}>
            <AppText variant="bodyStrong" color={colors.white}>
              Valider
            </AppText>
          </Pressable>
        </Animated.View>
      </View>

      {keyboardVisible ? (
        <Pressable accessibilityRole="button" onPress={() => Keyboard.dismiss()} style={styles.seaLink}>
          <AppText variant="small" color={colors.water}>
            Elle rejoint la mer ? Choisir la mer
          </AppText>
        </Pressable>
      ) : (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <AppText variant="small" color={colors.inkMuted}>
              ou, si elle rejoint la mer
            </AppText>
            <View style={styles.dividerLine} />
          </View>
          <SeaGrid onPick={onSea} />
        </>
      )}
    </View>
  );
}

function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },
  message: {
    textAlign: 'center',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.waterTint,
    borderWidth: 1,
    borderColor: colors.nightText,
    justifyContent: 'center',
  },
  chipPressed: {
    backgroundColor: colors.waterSoft,
  },
  chipText: {
    fontSize: 15,
  },
  field: {
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 52,
    borderWidth: 2,
    borderColor: colors.water,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.bodyMedium,
    fontSize: 17,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  validate: {
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.water,
    justifyContent: 'center',
  },
  seaLink: {
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
});
