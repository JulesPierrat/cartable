import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useColors } from '@/platform/theme';

/** Icônes au trait, reprises des maquettes (grille 24×24). */
const icons = {
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  check: <Path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrowRight: <Path d="M5 12h14M13 6l6 6-6 6" />,
  chevronRight: <Path d="M9 6l6 6-6 6" />,
  play: <Path d="M8 5.5v13l10-6.5z" />,
  droplet: <Path d="M12 3.5c3.5 4 6 7.3 6 10.5a6 6 0 0 1-12 0c0-3.2 2.5-6.5 6-10.5z" />,
  hint: (
    <>
      <Path d="M9 18h6M10 21h4" />
      <Path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z" />
    </>
  ),
  lock: (
    <>
      <Rect x="5" y="11" width="14" height="10" rx="2" />
      <Path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </>
  ),
  compass: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  stats: <Path d="M5 20v-8M12 20V5M19 20v-5" />,
  profile: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4.5 20.5c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </>
  ),
  share: (
    <>
      <Path d="M12 15V3.5M7.5 8L12 3.5 16.5 8" />
      <Path d="M5 13v5.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V13" />
    </>
  ),
  wave: (
    <>
      <Path d="M3 9.5c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <Path d="M3 15c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
    </>
  ),
  calendar: (
    <>
      <Rect x="4" y="5" width="16" height="16" rx="2" />
      <Path d="M4 10h16M8 3v4M16 3v4" />
    </>
  ),
} as const;

export type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
  /** Remplit la forme au lieu de la dessiner au trait (goutte pleine, triangle « play »). */
  filled?: boolean;
};

export function Icon({ name, size = 24, color: requestedColor, strokeWidth = 2, filled = false }: IconProps) {
  const colors = useColors();
  const color = requestedColor ?? colors.ink;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {icons[name]}
    </Svg>
  );
}
