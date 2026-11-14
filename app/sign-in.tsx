import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { StyleSheet, Text } from "react-native";

import { AuthOptions } from "@/components/auth-options";
import { AuthScreen } from "@/components/auth-screen";
import { TextButton } from "@/components/primary-button";
import { fontFamily, fontSize } from "@/constants/theme";
import { useProgress } from "@/hooks/use-progress";
import { useTheme } from "@/hooks/use-theme";

/**
 * Sign in, opened from the landing screen, or from Settings by a guest (who
 * has already started, so "Get started with Doshi" is hidden for them).
 *
 * Mock UI: auth isn't built yet (see README, Accounts + sync). Only "Sign in
 * with email" (to the code screen) and "Get started with Doshi" (to account
 * creation) go anywhere.
 */
export default function SignInScreen() {
  const { theme } = useTheme();
  const { guest } = useProgress();

  const handleContinueWithEmail = (email: string) =>
    router.push({ pathname: "/verify-email", params: { email } });
  // Pushes, like the tour's "Create an account", so Back returns here.
  const handleGetStarted = () => router.push("/onboarding");

  return (
    <AuthScreen
      title="Welcome back!"
      subtitle="Sign in to your Doshi account."
      footer={
        guest ? undefined : (
          <>
            <Text style={[styles.prompt, { color: theme.textMuted }]}>
              Don&apos;t have an account?
            </Text>
            <TextButton
              label="Get started with Doshi"
              onPress={handleGetStarted}
              emphasized
              icon={ArrowRight}
            />
          </>
        )
      }
    >
      <AuthOptions
        mode="sign-in"
        onContinueWithEmail={handleContinueWithEmail}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  prompt: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
});
