import { Pressable, StyleSheet } from 'react-native';

import { touchTarget, useThemedStyles, type Palette } from '@/platform/theme';
import { Icon, type IconName } from '@/platform/ui/Icon';

type IconButtonProps = {
  icon: IconName;
  /** Obligatoire : c'est le seul texte que lit un lecteur d'écran. */
  accessibilityLabel: string;
  onPress: () => void;
  color?: string;
};

/** Bouton rond blanc avec une icône seule (fermer, indice…). */
export function IconButton({ icon, accessibilityLabel, onPress, color }: IconButtonProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={icon} size={20} color={color} />
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  button: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
