import { Text, type TextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/platform/theme';

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
};

/**
 * Texte de l'app : toujours une des variantes typographiques du thème. Il suit la taille de texte
 * choisie dans les réglages du téléphone, jusqu'à 1,5 fois, pour que les mises en page tiennent.
 */
export function AppText({ variant = 'body', color = colors.ink, style, ...props }: AppTextProps) {
  return <Text maxFontSizeMultiplier={1.5} {...props} style={[typography[variant], { color }, style]} />;
}
