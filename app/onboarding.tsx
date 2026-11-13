import { router } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { AuthOptions } from "@/components/auth-options";
import { AuthScreen } from "@/components/auth-screen";
import { TextButton } from "@/components/primary-button";
import { fontFamily, fontSize } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * The first onboarding step, opened by Get started on the landing screen, by
 * "Get started with Doshi" on sign-in and at the end of the tour: create an
 * account, or try Doshi without one.
 *
 * Mock UI: auth isn't built yet (see README, Accounts + sync). Only "Continue
 * with email" and "Try without an account" go anywhere.
 *
 * A single file for now. When onboarding gets more steps, move them into an
 * app/onboarding/ folder with its own _layout.tsx, like app/lesson/. An index
 * route in a folder without a layout is typed as "/onboarding/index" by Expo's
 * route-type generator on Windows.
 */
export default function CreateAccountScreen() {
  const { theme } = useTheme();

  const handleContinueWithEmail = (email: string) =>
    router.push({ pathname: "/verify-email", params: { email } });
  // Replaces this screen rather than pushing, so Home doesn't sit on top of
  // the sign-up screen.
  const handleTryWithoutAccount = () => router.replace("/home");

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Save your progress and pick up where you left off on any device."
      footer={
        <>
          <TextButton
            label="Try without an account"
            onPress={handleTryWithoutAccount}
            emphasized
          />
          <Text style={[styles.note, { color: theme.textMuted }]}>
            Your progress stays on this device.
          </Text>
        </>
      }
    >
      <AuthOptions onContinueWithEmail={handleContinueWithEmail} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
});
