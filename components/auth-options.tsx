import { type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { AppleLogo, GoogleLogo } from "@/components/provider-logos";
import { ThemedTextInput } from "@/components/themed-text-input";
import {
  fontFamily,
  fontSize,
  iconSize,
  letterSpacing,
  radius,
  signInProvider,
  spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { isPlausibleEmail } from "@/utils/email";

type AuthOptionsProps = {
  /** Called with the trimmed address once it looks like an email. */
  onContinueWithEmail: (email: string) => void;
};

/**
 * The ways in, shared by sign-in and account creation: Apple, Google, or a
 * code sent by email. All three are offered on iOS and Android, so an account
 * made on one platform can be opened on the other.
 *
 * Mock UI: auth isn't built yet (see README, Accounts + sync), so the Apple
 * and Google buttons do nothing.
 */
export function AuthOptions({ onContinueWithEmail }: AuthOptionsProps) {
  const { scheme, theme } = useTheme();
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);

  const address = email.trim();
  const canContinue = isPlausibleEmail(address);
  const apple = signInProvider.apple[scheme];

  const handleApple = () => {};
  const handleGoogle = () => {};
  const handleContinue = () => {
    if (canContinue) {
      onContinueWithEmail(address);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <ProviderButton
          label="Continue with Apple"
          logo={<AppleLogo size={iconSize.md} color={apple.label} />}
          onPress={handleApple}
          background={apple.background}
          backgroundPressed={apple.backgroundPressed}
          labelColor={apple.label}
        />
        <ProviderButton
          label="Continue with Google"
          logo={<GoogleLogo size={iconSize.md} />}
          onPress={handleGoogle}
          background={theme.surface}
          backgroundPressed={theme.background}
          labelColor={theme.text}
          borderColor={theme.borderStrong}
        />
      </View>

      <View style={styles.divider}>
        <View style={[styles.rule, { backgroundColor: theme.border }]} />
        <Text style={[styles.dividerLabel, { color: theme.textMuted }]}>
          or
        </Text>
        <View style={[styles.rule, { backgroundColor: theme.border }]} />
      </View>

      <View style={styles.group}>
        <ThemedTextInput
          accessibilityLabel="Email address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          onBlur={() => setEmailFocused(false)}
          onChangeText={setEmail}
          onFocus={() => setEmailFocused(true)}
          onSubmitEditing={handleContinue}
          placeholder="Email address"
          returnKeyType="go"
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: emailFocused ? theme.text : theme.borderStrong,
              color: theme.text,
            },
          ]}
          textContentType="emailAddress"
          value={email}
        />
        <PrimaryButton
          label="Continue with email"
          disabled={!canContinue}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

type ProviderButtonProps = {
  label: string;
  logo: ReactNode;
  onPress: () => void;
  background: string;
  backgroundPressed: string;
  labelColor: string;
  /** Outlines the button, for one whose fill is close to the background. */
  borderColor?: string;
};

/** A full-width "Continue with …" button with the provider's logo. */
function ProviderButton({
  label,
  logo,
  onPress,
  background,
  backgroundPressed,
  labelColor,
  borderColor,
}: ProviderButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        borderColor ? [styles.outlined, { borderColor }] : null,
        { backgroundColor: pressed ? backgroundPressed : background },
      ]}
    >
      {logo}
      <Text style={[styles.buttonLabel, { color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  group: {
    gap: spacing.md,
  },
  // Same size as PrimaryButton, with room for the logo before the label.
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  outlined: {
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  buttonLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
  },
  dividerLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  input: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
  },
});
