import { NativeTabs } from 'expo-router/native-tabs';

import { fonts, useColors } from '@/platform/theme';

/**
 * Barre d'onglets native : Liquid Glass sur iOS 26 et plus, barre Material sur Android.
 * Icônes système (SF Symbols sur iOS, Material Symbols sur Android). Sur le web : `_layout.web.tsx`.
 */
export default function TabsLayout() {
  const colors = useColors();
  return (
    <NativeTabs tintColor={colors.water} labelStyle={{ fontFamily: fonts.bodyBold }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'safari', selected: 'safari.fill' }} md="explore" />
        <NativeTabs.Trigger.Label>Jouer</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profil">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
