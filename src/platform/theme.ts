import type { TextStyle } from 'react-native';

/** Palette reprise des maquettes : fond clair, encre bleu nuit, eau bleue, orange pour les erreurs. */
export const colors = {
  background: '#F3F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#E8EEF2',
  ink: '#0F2537',
  inkSoft: '#3F5263',
  inkMuted: '#4A5D6C',
  water: '#1665C1',
  waterSoft: '#DCEBFA',
  waterTint: '#EEF5FC',
  night: '#0B3A66',
  nightText: '#CFE0F2',
  error: '#B13A0B',
  errorSoft: '#FDEBDD',
  border: '#D5DEE5',
  borderStrong: '#B8C7D3',
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;

/** Noms des polices chargées dans `src/app/_layout.tsx` (voir `fonts.ts`). */
export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

/** Taille minimale d'une zone tactile. */
export const touchTarget = 44;

export const typography = {
  display: { fontFamily: fonts.display, fontSize: 36, lineHeight: 38, letterSpacing: -0.7 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
  heading: { fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
