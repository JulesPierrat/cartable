import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { geoSnapshot } from '@/games/jusqua-la-mer/data/geo';
import { dataset } from '@/games/jusqua-la-mer/data/rivers';
import { colors, radius, spacing, touchTarget } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Icon } from '@/platform/ui/Icon';
import { Screen } from '@/platform/ui/Screen';

function frenchDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ProfileScreen() {
  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="title" accessibilityRole="header">
          Profil
        </AppText>

        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/jeux/jusqua-la-mer/regles')}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <Icon name="hint" size={20} color={colors.water} />
            <AppText variant="bodyStrong" style={styles.linkText}>
              Comment jouer à « Jusqu&apos;à la mer »
            </AppText>
            <Icon name="chevronRight" size={18} color={colors.inkMuted} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <AppText variant="bodyStrong">Sources des données</AppText>
          <AppText variant="small" color={colors.inkSoft}>
            Cours d&apos;eau et embouchures : Wikidata (CC0), données du {frenchDate(dataset.snapshot)}.
          </AppText>
          <AppText variant="small" color={colors.inkSoft}>
            Tracés des rivières et contour de la France : IGN – BD TOPO® et ADMIN EXPRESS, Licence Ouverte 2.0,
            données consultées le {frenchDate(geoSnapshot)}.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  link: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  linkText: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
