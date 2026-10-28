import { Stack } from 'expo-router';

import { GameSessionProvider } from '@/games/jusqua-la-mer/session';
import { colors } from '@/platform/theme';

export default function JusquaLaMerLayout() {
  return (
    <GameSessionProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="regles" />
        <Stack.Screen name="partie" options={{ gestureEnabled: false }} />
        <Stack.Screen name="resultat" options={{ gestureEnabled: false }} />
      </Stack>
    </GameSessionProvider>
  );
}
