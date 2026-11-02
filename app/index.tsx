import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KanaBackdrop } from "@/components/kana-backdrop";
import {
  fontFamily,
  fontSize,
  letterSpacing,
  maxContentWidth,
  radius,
  spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function LandingScreen() {
  const { theme } = useTheme();

  // Goes straight to the test home tabs; there is no onboarding or auth yet.
  const handleGetStarted = () => router.push("/home");
  // Intentionally empty — sign-in flow is undecided.
  const handleSignIn = () => {};

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <KanaBackdrop />
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.wordmark, { color: theme.text }]}>Doshi</Text>
            <Text style={[styles.tagline, { color: theme.textMuted }]}>
              Simple Japanese vocabulary learning.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={handleGetStarted}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: pressed ? theme.accentPressed : theme.accent,
                },
              ]}
            >
              <Text style={[styles.buttonLabel, { color: theme.onAccent }]}>
                Get started
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleSignIn}
              style={({ pressed }) => [
                styles.button,
                styles.buttonSecondary,
                {
                  borderColor: theme.borderStrong,
                  backgroundColor: pressed ? theme.surface : "transparent",
                },
              ]}
            >
              <Text style={[styles.buttonLabel, { color: theme.text }]}>
                Sign in
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignSelf: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.xl,
    gap: spacing["3xl"],
  },
  header: {
    alignItems: "center",
    gap: spacing.md,
  },
  wordmark: {
    fontSize: fontSize.display,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.tight,
  },
  tagline: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  buttonSecondary: {
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  buttonLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
});
