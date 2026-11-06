import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  useFonts,
} from '@expo-google-fonts/figtree';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { initProgress } from '@/lib/progress';

// Keep the splash screen up until Figtree and the user's progress have loaded,
// so text never flashes in the system font and screens never show empty data.
SplashScreen.preventAutoHideAsync();

type ProgressStatus = 'loading' | 'ready' | 'failed';

export default function RootLayout() {
  const { theme } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  const [progress, setProgress] = useState<ProgressStatus>('loading');

  useEffect(() => {
    initProgress().then(
      () => setProgress('ready'),
      (error) => {
        console.error('Loading progress failed', error);
        setProgress('failed');
      },
    );
  }, []);

  const fontsSettled = fontsLoaded || fontError;
  useEffect(() => {
    if (fontsSettled && progress !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [fontsSettled, progress]);

  // On a font error, render anyway and let text fall back to the system font.
  if (!fontsSettled || progress === 'loading') {
    return null;
  }

  // Every screen depends on progress, so there's nothing useful to show
  // without it.
  if (progress === 'failed') {
    return (
      <View style={[styles.failed, { backgroundColor: theme.background }]}>
        <Text style={[styles.failedText, { color: theme.text }]}>
          Doshi couldn&apos;t load your progress. Please restart the app.
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen
            name="lesson"
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="review"
            options={{ presentation: 'fullScreenModal' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  failed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  failedText: {
    fontSize: fontSize.md,
    textAlign: 'center',
  },
});
