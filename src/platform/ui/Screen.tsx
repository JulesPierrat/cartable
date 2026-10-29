import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/platform/theme';

/**
 * Hauteur de la barre d'onglets native, qui flotte par-dessus le contenu (Liquid Glass sur iOS) :
 * marge à laisser en bas d'un écran d'onglet. Sur le web, la barre ne recouvre rien.
 */
export const tabBarInset = Platform.select({ ios: 50, android: 80, default: 0 });

type ScreenProps = {
  children: ReactNode;
  /** Les écrans à onglets laissent la barre d'onglets gérer le bas. */
  edges?: Edge[];
};

/** Conteneur de base d'un écran : fond de l'app, marges et zones sûres. */
export function Screen({ children, edges = ['top', 'bottom'] }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
