import { router } from "expo-router";

import { AuthOptions } from "@/components/auth-options";
import { AuthScreen } from "@/components/auth-screen";
import { TextButton } from "@/components/primary-button";

/**
 * Sign in, opened from the landing screen. Mock UI: auth isn't built yet (see
 * README, Accounts + sync). Only "Continue with email" (to the code screen)
 * and "Get started with Doshi" (to account creation) go anywhere.
 */
export default function SignInScreen() {
  const handleContinueWithEmail = (email: string) =>
    router.push({ pathname: "/verify-email", params: { email } });
  // Pushes, like the tour's "Create an account", so Back returns here.
  const handleGetStarted = () => router.push("/onboarding");

  return (
    <AuthScreen
      title="Welcome back!"
      subtitle="Sign in to your Doshi account."
      footer={
        <TextButton label="Get started with Doshi" onPress={handleGetStarted} />
      }
    >
      <AuthOptions onContinueWithEmail={handleContinueWithEmail} />
    </AuthScreen>
  );
}
