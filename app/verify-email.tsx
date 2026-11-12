import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  type TextInputInstance,
  View,
} from "react-native";

import { AuthScreen } from "@/components/auth-screen";
import { PrimaryButton, TextButton } from "@/components/primary-button";
import { ThemedTextInput } from "@/components/themed-text-input";
import { fontFamily, fontSize, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const CODE_LENGTH = 6;

/**
 * Enter the code emailed by "Continue with email", on sign-in or account
 * creation. Mock UI: auth isn't built yet (see README, Accounts + sync), so
 * no email is sent and no code is checked.
 */
export default function VerifyEmailScreen() {
  const { theme } = useTheme();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const inputRef = useRef<TextInputInstance>(null);
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);

  // On Android, closing the keyboard with Back leaves the input focused, and
  // focusing it again doesn't reopen the keyboard. Blurring when the keyboard
  // hides lets a tap on the boxes bring it back.
  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", () =>
      inputRef.current?.blur(),
    );
    return () => subscription.remove();
  }, []);

  // Digits only: a code filled in from the keyboard's suggestions or clipboard
  // can arrive with a space in it. No maxLength on the input for the same
  // reason: it would cut "123 456" short before the space is removed.
  const handleChangeCode = (text: string) =>
    setCode(text.replace(/\D/g, "").slice(0, CODE_LENGTH));
  const handleVerify = () => {};
  const handleResend = () => {};

  return (
    <AuthScreen
      title="Check your email"
      subtitle={`Enter the ${CODE_LENGTH}-digit code we sent to ${email || "your email"}.`}
      footer={<TextButton label="Resend code" onPress={handleResend} />}
    >
      <View style={styles.form}>
        {/* One hidden input behind six boxes, so the keyboard's code
            suggestion fills the whole code at once. Tapping the boxes
            focuses it. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${CODE_LENGTH}-digit code`}
          accessibilityValue={{
            text: code ? code.split("").join(" ") : "Empty",
          }}
          onPress={() => inputRef.current?.focus()}
          style={styles.boxes}
        >
          {Array.from({ length: CODE_LENGTH }, (_, index) => (
            <View
              key={index}
              style={[
                styles.box,
                {
                  backgroundColor: theme.surface,
                  borderColor:
                    focused && index === code.length
                      ? theme.text
                      : theme.borderStrong,
                },
              ]}
            >
              {/* A space keeps an empty box as tall as a filled one. */}
              <Text style={[styles.digit, { color: theme.text }]}>
                {code[index] ?? " "}
              </Text>
            </View>
          ))}
          <ThemedTextInput
            ref={inputRef}
            autoComplete="one-time-code"
            autoFocus
            caretHidden
            keyboardType="number-pad"
            onBlur={() => setFocused(false)}
            onChangeText={handleChangeCode}
            onFocus={() => setFocused(true)}
            style={styles.hiddenInput}
            textContentType="oneTimeCode"
            value={code}
          />
        </Pressable>

        <PrimaryButton
          label="Continue"
          disabled={code.length < CODE_LENGTH}
          onPress={handleVerify}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.xl,
  },
  boxes: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  digit: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.semibold,
  },
  // Invisible and out of the way; the boxes show what's typed.
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
