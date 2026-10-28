import { Text, type TextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/platform/theme';

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
};

/** Texte de l'app : toujours une des variantes typographiques du thème. */
export function AppText({ variant = 'body', color = colors.ink, style, ...props }: AppTextProps) {
  return <Text {...props} style={[typography[variant], { color }, style]} />;
}
