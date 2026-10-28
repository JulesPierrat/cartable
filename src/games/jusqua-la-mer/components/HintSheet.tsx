import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RiverMap } from '@/games/jusqua-la-mer/components/RiverMap';
import type { GameState, Hint } from '@/games/jusqua-la-mer/engine/game';
import { hintCaption, hintMap } from '@/games/jusqua-la-mer/presentation';
import { colors, radius, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Button } from '@/platform/ui/Button';

type HintSheetProps = {
  hint: Hint | null;
  state: GameState;
  onClose: () => void;
};

/** L'indice : une carte vierge de la France où le cours d'eau à trouver est mis en avant. */
export function HintSheet({ hint, state, onClose }: HintSheetProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mapWidth = Math.min(width, 480) - 2 * spacing.xl;

  return (
    <Modal visible={hint !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer l'indice" />
      {hint ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <AppText variant="label" color={colors.water}>
            Indice
          </AppText>
          <RiverMap
            width={mapWidth}
            height={mapWidth}
            framing="france"
            {...hintMap(hint, state)}
            accessibilityLabel="Carte de France avec le tracé à deviner"
          />
          <AppText variant="small" color={colors.inkSoft}>
            {hintCaption(hint, state)}
          </AppText>
          <Button label="Compris" onPress={onClose} />
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 37, 55, 0.4)',
  },
  sheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
});
