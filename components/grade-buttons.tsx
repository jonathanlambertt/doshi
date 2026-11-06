import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Grade } from "@/lib/srs/scheduler";

type GradeButtonsProps = {
  onGrade: (grade: Grade) => void;
};

/**
 * Again / Good. Deliberately neutral (Zinc, no red/green): semantic feedback
 * colors aren't defined yet, and the Rose accent reads as "error" — see the
 * styling notes in CLAUDE.md.
 */
export function GradeButtons({ onGrade }: GradeButtonsProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="You didn't remember it. It comes back sooner."
        onPress={() => onGrade("again")}
        style={({ pressed }) => [
          styles.button,
          styles.again,
          {
            borderColor: theme.borderStrong,
            backgroundColor: pressed ? theme.surface : theme.background,
          },
        ]}
      >
        <Text style={[styles.label, { color: theme.text }]}>Again</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="You remembered it."
        onPress={() => onGrade("good")}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: pressed ? theme.textMuted : theme.text },
        ]}
      >
        <Text style={[styles.label, { color: theme.background }]}>Good</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  again: {
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  label: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
});
