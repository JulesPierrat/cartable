import { useMemo } from 'react';
import { useColorScheme, type TextStyle } from 'react-native';

/**
 * Les deux palettes de l'app, choisies selon le thème clair ou sombre du téléphone.
 * Clair : celle des maquettes (fond clair, encre bleu nuit, eau bleue, orange pour les erreurs).
 * Sombre : mêmes rôles, mêmes contrastes (vérifiés par `__tests__/theme-test.ts`).
 */
const light = {
  background: '#F3F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#E8EEF2',
  ink: '#0F2537',
  inkSoft: '#3F5263',
  inkMuted: '#4A5D6C',
  /** Accent principal : boutons, traits, liens. */
  water: '#1665C1',
  /** Texte et icônes posés sur `water`. */
  onWater: '#FFFFFF',
  waterSoft: '#DCEBFA',
  waterTint: '#EEF5FC',
  /** Accent fort pour du texte ou des tracés (titres de chiffres, pastilles, chemin connu). */
  night: '#0B3A66',
  /** Fond des blocs mis en avant (carte du défi du jour, pastille de la mer), avec `white` et `nightText` dessus. */
  hero: '#0B3A66',
  nightText: '#CFE0F2',
  error: '#B13A0B',
  errorSoft: '#FDEBDD',
  border: '#D5DEE5',
  borderStrong: '#B8C7D3',
  white: '#FFFFFF',
  /** Carte : la terre et la mer. */
  land: '#FFFFFF',
  sea: '#CFE3F6',
};

export type Palette = { readonly [K in keyof typeof light]: string };
export type ColorName = keyof Palette;

const dark: Palette = {
  background: '#0E1720',
  surface: '#16222D',
  surfaceMuted: '#1F2D3A',
  ink: '#E6EDF3',
  inkSoft: '#C3CED8',
  inkMuted: '#9AABB9',
  water: '#5EA8F2',
  onWater: '#0B1A28',
  waterSoft: '#1B3A57',
  waterTint: '#162D44',
  night: '#B9D6F5',
  hero: '#163E66',
  nightText: '#CFE0F2',
  error: '#FF8A65',
  errorSoft: '#3A2018',
  border: '#2A3A48',
  borderStrong: '#3E5263',
  white: '#FFFFFF',
  land: '#2A3B4B',
  sea: '#0A1826',
};

export const palettes: { light: Palette; dark: Palette } = { light, dark };

/** Palette du thème actuel du téléphone ; le composant se redessine quand le thème change. */
export function useColors(): Palette {
  return useColorScheme() === 'dark' ? palettes.dark : palettes.light;
}

/** Styles qui dépendent des couleurs, recalculés seulement quand le thème change. */
export function useThemedStyles<T>(factory: (colors: Palette) => T): T {
  const colors = useColors();
  return useMemo(() => factory(colors), [factory, colors]);
}

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
