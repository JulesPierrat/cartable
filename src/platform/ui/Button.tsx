import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/platform/theme';
import { AppText } from '@/platform/ui/AppText';
import { Icon, type IconName } from '@/platform/ui/Icon';

type ButtonVariant = 'primary' | 'secondary' | 'light';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Icône placée avant le texte. */
  icon?: IconName;
  /** Icône placée après le texte. */
  trailingIcon?: IconName;
};

const palette: Record<ButtonVariant, { background: string; text: string; border: string }> = {
  primary: { background: colors.water, text: colors.white, border: colors.water },
  secondary: { background: colors.surface, text: colors.water, border: colors.water },
  light: { background: colors.white, text: colors.night, border: colors.white },
};

export function Button({ label, onPress, variant = 'primary', icon, trailingIcon }: ButtonProps) {
  const { background, text, border } = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderColor: border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={styles.content}>
        {icon ? <Icon name={icon} size={20} color={text} filled={icon === 'play'} /> : null}
        <AppText variant="bodyStrong" color={text}>
          {label}
        </AppText>
        {trailingIcon ? <Icon name={trailingIcon} size={20} color={text} strokeWidth={2.2} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 2,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
