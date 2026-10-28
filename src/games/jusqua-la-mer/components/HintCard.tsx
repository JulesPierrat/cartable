import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { RiverMap } from '@/games/jusqua-la-mer/components/RiverMap';
import type { GameState, Hint } from '@/games/jusqua-la-mer/engine/game';
import { hintCaption, hintMap } from '@/games/jusqua-la-mer/presentation';
import { colors, fonts, radius, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Button } from '@/platform/ui/Button';
import { IconButton } from '@/platform/ui/IconButton';

type HintCardProps = {
  hint: Hint;
  state: GameState;
  onHide: () => void;
  /** Le 2e indice de l'étape, s'il en reste un : `null` quand il ne reste qu'une vie. */
  onNextHint?: (() => void) | null;
};

/**
 * L'indice, affiché en haut de l'écran de partie (au-dessus du chemin, pour rester visible
 * au-dessus de la zone de saisie) : la carte vierge de la France et sa légende.
 */
export function HintCard({ hint, state, onHide, onNextHint }: HintCardProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(Math.round(event.nativeEvent.layout.width));

  return (
    <View style={styles.card}>
      <View onLayout={onLayout}>
        {width > 0 ? (
          <RiverMap
            width={width}
            height={Math.round(width * 0.8)}
            framing="france"
            {...hintMap(hint, state)}
            accessibilityLabel="Carte de France avec le tracé à deviner"
          />
        ) : null}
        <View style={styles.close}>
          <IconButton icon="close" accessibilityLabel="Masquer la carte de l'indice" onPress={onHide} />
        </View>
      </View>
      <AppText variant="small" color={colors.inkSoft}>
        <AppText variant="small" color={colors.water} style={styles.label}>
          Indice ·{' '}
        </AppText>
        {hintCaption(hint, state)}
      </AppText>
      {onNextHint ? (
        <Button label="2e indice : le cours d'eau à trouver (−1 vie)" variant="secondary" onPress={onNextHint} />
      ) : onNextHint === null ? (
        <AppText variant="caption" color={colors.inkMuted}>
          Il te faut au moins deux vies pour le 2e indice.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  close: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodyBold,
  },
});
