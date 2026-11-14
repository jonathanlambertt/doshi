import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { AuthOptions } from "@/components/auth-options";
import { AuthScreen } from "@/components/auth-screen";
import { TextButton } from "@/components/primary-button";
import { fontFamily, fontSize, spacing } from "@/constants/theme";
import { useProgress } from "@/hooks/use-progress";
import { useTheme } from "@/hooks/use-theme";
import { setGuest } from "@/lib/progress";
import { resetTo } from "@/utils/navigation";

/**
 * The first onboarding step, opened by Get started on the landing screen, by
 * "Get started with Doshi" on sign-in and at the end of the tour: create an
 * account, or try Doshi without one. A guest gets here from "Create an
 * account" in Settings, so for them the way to skip is hidden.
 *
 * Mock UI: auth isn't built yet (see README, Accounts + sync). Only "Sign up
 * with email" and "Try without an account" go anywhere.
 *
 * A single file for now. When onboarding gets more steps, move them into an
 * app/onboarding/ folder with its own _layout.tsx, like app/lesson/. An index
 * route in a folder without a layout is typed as "/onboarding/index" by Expo's
 * route-type generator on Windows.
 */
export default function CreateAccountScreen() {
  const { theme } = useTheme();
  const { guest } = useProgress();

  const handleContinueWithEmail = (email: string) =>
    router.push({ pathname: "/verify-email", params: { email } });
  // Clears the history, so Back from Home can't return to these screens.
  const handleTryWithoutAccount = () => {
    setGuest(true);
    resetTo("/home");
  };

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Save your progress and pick up where you left off on any device."
    >
      <View style={styles.options}>
        <AuthOptions
          mode="sign-up"
          onContinueWithEmail={handleContinueWithEmail}
        />
        {/* Right under the sign-up buttons, so skipping is easy to find. */}
        {guest ? null : (
          <View style={styles.skip}>
            <TextButton
              label="Try without an account"
              onPress={handleTryWithoutAccount}
              emphasized
              icon={ArrowRight}
            />
            <Text style={[styles.note, { color: theme.textMuted }]}>
              Your progress stays on this device.
            </Text>
          </View>
        )}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.sm,
  },
  skip: {
    alignItems: "center",
    gap: spacing.xs,
  },
  note: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
});
