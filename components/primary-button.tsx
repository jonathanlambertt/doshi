import { Pressable, StyleSheet, Text } from "react-native";

import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ButtonProps = {
  label: string;
  onPress: () => void;
};

type PrimaryButtonProps = ButtonProps & {
  /** Greyed out and not pressable, e.g. until a form is filled in. */
  disabled?: boolean;
};

/** A full-width button in the brand accent, for the screen's main action. */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: PrimaryButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled
            ? theme.border
            : pressed
              ? theme.accentPressed
              : theme.accent,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: disabled ? theme.textSubtle : theme.onAccent },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** An outlined, neutral button for a secondary action beside a PrimaryButton. */
export function SecondaryButton({ label, onPress }: ButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.outlined,
        {
          borderColor: theme.borderStrong,
          backgroundColor: pressed ? theme.surface : theme.background,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * A borderless text button for a minor action, such as a link under a
 * screen's main buttons. Centered, and tall enough to tap comfortably.
 */
export function TextButton({ label, onPress }: ButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.textButton}
    >
      {({ pressed }) => (
        <Text
          style={[
            styles.label,
            styles.textLabel,
            { color: pressed ? theme.textSubtle : theme.textMuted },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  outlined: {
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  label: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  textButton: {
    alignSelf: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  textLabel: {
    textAlign: "center",
  },
});
