import { useFonts } from '@expo-google-fonts/dm-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { fontAssets } from '@/platform/fonts';
import { storage } from '@/platform/storage';
import { colors } from '@/platform/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const [storageReady, setStorageReady] = useState(false);
  const ready = (loaded || error !== null) && storageReady;

  // Les parties, la série de jours et les réglages sont chargés en mémoire avant le premier écran.
  useEffect(() => {
    storage.load().finally(() => setStorageReady(true));
  }, []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
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
        {/* Chaque jeu a son propre `_layout.tsx` (et son état de partie) dans src/app/jeux/<jeu>/. */}
        <Stack.Screen name="jeux/jusqua-la-mer" />
      </Stack>
    </>
  );
}
