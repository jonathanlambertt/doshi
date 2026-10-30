import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fontSize,
  fontWeight,
  letterSpacing,
  maxContentWidth,
  radius,
  spacing,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LandingScreen() {
  const { theme } = useTheme();

  // Intentionally empty — this skeleton has no navigation or auth yet.
  const handleGetStarted = () => {};
  const handleSignIn = () => {};

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.wordmark, { color: theme.text }]}>Doshi</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>
            Learn Japanese vocabulary at a steady pace.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: pressed ? theme.accentPressed : theme.accent },
            ]}>
            <Text style={[styles.buttonLabel, { color: theme.onAccent }]}>Get Started</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleSignIn}
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              {
                borderColor: theme.borderStrong,
                backgroundColor: pressed ? theme.surface : 'transparent',
              },
            ]}>
            <Text style={[styles.buttonLabel, { color: theme.text }]}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.xl,
    gap: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
  },
  wordmark: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  tagline: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  buttonSecondary: {
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  buttonLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
  },
});
