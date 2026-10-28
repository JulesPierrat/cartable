import { useFonts } from '@expo-google-fonts/dm-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { fontAssets } from '@/platform/fonts';
import { colors } from '@/platform/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="jeux/jusqua-la-mer/regles" />
        <Stack.Screen name="jeux/jusqua-la-mer/partie" options={{ gestureEnabled: false }} />
        <Stack.Screen name="jeux/jusqua-la-mer/resultat" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}
