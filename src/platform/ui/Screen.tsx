import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { spacing, useThemedStyles, type Palette } from '@/platform/theme';

/**
 * Hauteur de la barre d'onglets native, qui flotte par-dessus le contenu (Liquid Glass sur iOS) :
 * marge à laisser en bas d'un écran d'onglet. Sur le web, la barre ne recouvre rien.
 */
export const tabBarInset = Platform.select({ ios: 50, android: 80, default: 0 });

/**
 * Marge à laisser en bas du défilement d'un écran d'onglet : il descend jusqu'en bas de l'écran,
 * sous la barre flottante, et son dernier élément doit rester accessible au-dessus d'elle.
 */
export function useTabBarSpace(): number {
  return tabBarInset + useSafeAreaInsets().bottom + spacing.xxl;
}

type ScreenProps = {
  children: ReactNode;
  /**
   * Un écran d'onglet passe `['top']` : son contenu descend jusqu'en bas de l'écran, sous la barre
   * d'onglets qui flotte par-dessus (il ajoute lui-même `useTabBarSpace()` en bas de son défilement).
   */
  edges?: Edge[];
};

/** Conteneur de base d'un écran : fond de l'app, marges et zones sûres. */
export function Screen({ children, edges = ['top', 'bottom'] }: ScreenProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      <View style={[styles.content, !edges.includes('bottom') && styles.underTabBar]}>{children}</View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  underTabBar: {
    paddingBottom: 0,
  },
});
