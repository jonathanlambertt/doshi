import { Pressable, StyleSheet, Text } from "react-native";

import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
};

/** A full-width button in the brand accent, for the screen's main action. */
export function PrimaryButton({ label, onPress }: PrimaryButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? theme.accentPressed : theme.accent },
      ]}
    >
      <Text style={[styles.label, { color: theme.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

/** An outlined, neutral button for a secondary action beside a PrimaryButton. */
export function SecondaryButton({ label, onPress }: PrimaryButtonProps) {
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
});
