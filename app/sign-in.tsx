import { router } from "expo-router";

import { AuthOptions } from "@/components/auth-options";
import { AuthScreen } from "@/components/auth-screen";

/**
 * Sign in, opened from the landing screen. Mock UI: auth isn't built yet (see
 * README, Accounts + sync). Only "Continue with email" goes anywhere, to the
 * code screen.
 */
export default function SignInScreen() {
  const handleContinueWithEmail = (email: string) =>
    router.push({ pathname: "/verify-email", params: { email } });

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to continue learning.">
      <AuthOptions onContinueWithEmail={handleContinueWithEmail} />
    </AuthScreen>
  );
}
