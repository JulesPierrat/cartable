import { Tabs } from 'expo-router/js-tabs';

import { fonts, useColors } from '@/platform/theme';
import { Icon } from '@/platform/ui/Icon';

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.water,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 12 },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jouer',
          tabBarIcon: ({ color }) => <Icon name="compass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <Icon name="stats" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Icon name="profile" color={color} />,
        }}
      />
    </Tabs>
  );
}
