import { StyleSheet, Text, View } from "react-native";

import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type GradeGuideProps = {
  /** What Again means and does on this screen's cards. */
  again: string;
  /** What Good means and does on this screen's cards. */
  good: string;
};

/**
 * Explains Again and Good, each next to a small copy of its button (see
 * `GradeButtons`), on the screens that introduce grading: the quick check's
 * intro and the first reviews. The copies are labels, not buttons.
 */
export function GradeGuide({ again, good }: GradeGuideProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View accessible accessibilityLabel={`Again: ${again}`} style={styles.row}>
        <View
          style={[
            styles.chip,
            { borderColor: theme.borderStrong, backgroundColor: theme.background },
          ]}
        >
          <Text style={[styles.chipLabel, { color: theme.text }]}>Again</Text>
        </View>
        <Text style={[styles.description, { color: theme.textMuted }]}>
          {again}
        </Text>
      </View>
      <View accessible accessibilityLabel={`Good: ${good}`} style={styles.row}>
        <View
          style={[
            styles.chip,
            { borderColor: theme.text, backgroundColor: theme.text },
          ]}
        >
          <Text style={[styles.chipLabel, { color: theme.background }]}>Good</Text>
        </View>
        <Text style={[styles.description, { color: theme.textMuted }]}>
          {good}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  // Both chips share a minimum width, so the descriptions line up, and a
  // border (Good's matches its fill), so they're the same height.
  chip: {
    minWidth: spacing["3xl"] + spacing.xl,
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  chipLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  description: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },
});
