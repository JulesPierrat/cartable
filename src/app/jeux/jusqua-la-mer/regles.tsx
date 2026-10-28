import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_LIVES } from '@/games/jusqua-la-mer/engine/game';
import { parseMode } from '@/games/jusqua-la-mer/presentation';
import { colors, fonts, radius, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Button } from '@/platform/ui/Button';
import { Icon, type IconName } from '@/platform/ui/Icon';
import { IconButton } from '@/platform/ui/IconButton';

export default function RulesScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <AppText variant="label" color={colors.water}>
            Jusqu&apos;à la mer
          </AppText>
          <IconButton icon="close" accessibilityLabel="Fermer" onPress={() => router.back()} />
        </View>

        <View style={styles.intro}>
          <AppText variant="title" accessibilityRole="header">
            Comment jouer
          </AppText>
          <AppText color={colors.inkMuted}>
            Tout cours d&apos;eau finit par rejoindre la mer. À toi de retrouver son chemin, étape par
            étape.
          </AppText>
        </View>

        <View style={styles.steps}>
          <RuleStep number={1} title="On te donne une rivière">
            <Pill>L&apos;Aisne</Pill>
          </RuleStep>
          <RuleStep number={2} title="Cite celle où elle se jette, puis la suivante…">
            <View style={styles.example}>
              <Pill>L&apos;Aisne</Pill>
              <Icon name="arrowRight" size={16} color={colors.inkMuted} />
              <Pill found>L&apos;Oise</Pill>
              <Icon name="arrowRight" size={16} color={colors.inkMuted} />
              <Pill found>La Seine</Pill>
            </View>
          </RuleStep>
          <RuleStep number={3} title="Termine par la mer ou l'océan">
            <View style={styles.seas}>
              {['Manche', 'Mer du Nord', 'Atlantique', 'Méditerranée'].map((sea, i) => (
                <View key={sea} style={[styles.sea, i === 0 && styles.seaChosen]}>
                  {i === 0 ? <Icon name="check" size={16} color={colors.white} strokeWidth={2.4} /> : null}
                  <AppText variant="small" color={i === 0 ? colors.white : colors.inkSoft} style={styles.seaText}>
                    {sea}
                  </AppText>
                </View>
              ))}
            </View>
          </RuleStep>
        </View>

        <View style={styles.rules}>
          <Rule icon="droplet" filled>
            <AppText variant="small" color={colors.ink} style={styles.bold}>
              {DEFAULT_LIVES} vies
            </AppText>{' '}
            — chaque mauvaise réponse en coûte une.
          </Rule>
          <Rule icon="hint">
            <AppText variant="small" color={colors.ink} style={styles.bold}>
              Indice
            </AppText>{' '}
            — montre sur une carte vierge le cours d&apos;eau à trouver, contre une vie.
          </Rule>
          <Rule icon="calendar" last>
            <AppText variant="small" color={colors.ink} style={styles.bold}>
              Un défi par jour
            </AppText>
            , le même pour tout le monde. Une étape entre parenthèses, comme la Gironde, est facultative.
          </Rule>
        </View>

        <Button
          label="C'est parti"
          trailingIcon="arrowRight"
          onPress={() =>
            router.replace({ pathname: '/jeux/jusqua-la-mer/partie', params: { mode: parseMode(mode) } })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function RuleStep({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.number}>
        <AppText variant="bodyStrong" color={colors.night} style={styles.numberText}>
          {number}
        </AppText>
      </View>
      <View style={styles.stepBody}>
        <AppText variant="bodyStrong">{title}</AppText>
        {children}
      </View>
    </View>
  );
}

function Pill({ children, found = false }: { children: ReactNode; found?: boolean }) {
  return (
    <View style={[styles.pill, found ? styles.pillFound : styles.pillPlain]}>
      <AppText variant="small" color={found ? colors.night : colors.ink} style={styles.bold}>
        {children}
      </AppText>
    </View>
  );
}

function Rule({
  icon,
  filled = false,
  last = false,
  children,
}: {
  icon: IconName;
  filled?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.rule, !last && styles.ruleBorder]}>
      <Icon name={icon} size={20} color={colors.water} filled={filled} />
      <AppText variant="small" color={colors.inkSoft} style={styles.ruleText}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intro: {
    gap: spacing.sm,
  },
  steps: {
    gap: spacing.xl,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
  },
  number: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.waterSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: fonts.display,
  },
  stepBody: {
    flex: 1,
    gap: spacing.sm,
    paddingTop: 5,
  },
  example: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  pillPlain: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillFound: {
    backgroundColor: colors.waterSoft,
  },
  seas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sea: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  seaChosen: {
    backgroundColor: colors.night,
    borderColor: colors.night,
  },
  seaText: {
    fontFamily: fonts.bodyMedium,
  },
  rules: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: 10,
  },
  ruleBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  ruleText: {
    flex: 1,
  },
  bold: {
    fontFamily: fonts.bodyBold,
  },
});
