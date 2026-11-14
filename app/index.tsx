import { Redirect, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KanaBackdrop } from "@/components/kana-backdrop";
import {
  PrimaryButton,
  SecondaryButton,
  TextButton,
} from "@/components/primary-button";
import {
  fontFamily,
  fontSize,
  letterSpacing,
  maxContentWidth,
  spacing,
} from "@/constants/theme";
import { useProgress } from "@/hooks/use-progress";
import { useTheme } from "@/hooks/use-theme";

/**
 * The first screen: the wordmark over faint kana, with the buttons along the
 * bottom within reach of a thumb. Get started opens account creation, Sign in
 * opens sign-in, and "What is Doshi?" opens the tour.
 *
 * Someone who already chose "Try without an account" goes straight to Home.
 */
export default function LandingScreen() {
  const { theme } = useTheme();
  const { guest } = useProgress();

  if (guest) {
    return <Redirect href="/home" />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <KanaBackdrop />
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={[styles.wordmark, { color: theme.text }]}>Doshi</Text>
            <Text style={[styles.tagline, { color: theme.textMuted }]}>
              Simple Japanese vocabulary learning.
            </Text>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label="Get started"
              onPress={() => router.push("/onboarding")}
            />
            <SecondaryButton
              label="Sign in"
              onPress={() => router.push("/sign-in")}
            />
            <TextButton
              label="What is Doshi?"
              onPress={() => router.push("/tour")}
              emphasized
            />
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
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  // Takes the space above the buttons and centers the wordmark in it.
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  wordmark: {
    fontSize: fontSize.display,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.tight,
  },
  tagline: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
  actions: {
    gap: spacing.md,
  },
});
