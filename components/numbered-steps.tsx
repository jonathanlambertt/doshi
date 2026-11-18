import { StyleSheet, Text, View } from "react-native";

import { fontFamily, fontSize, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type NumberedStep = {
  title: string;
  description: string;
};

/** "md" for a list of steps; "sm" where it labels lines of text. */
type NumberSize = "md" | "sm";

type StepNumberProps = {
  number: number;
  size?: NumberSize;
};

/** A number in a circle, marking a step or a labeled part of an example. */
export function StepNumber({ number, size = "md" }: StepNumberProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.number,
        size === "sm" ? styles.numberSm : styles.numberMd,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text
        style={[
          styles.numberLabel,
          size === "sm" ? styles.numberLabelSm : styles.numberLabelMd,
          { color: theme.text },
        ]}
      >
        {number}
      </Text>
    </View>
  );
}

type NumberedStepsProps = {
  steps: readonly NumberedStep[];
  numberSize?: NumberSize;
};

/** Steps numbered from 1, each with a title and a short description. */
export function NumberedSteps({ steps, numberSize = "md" }: NumberedStepsProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.steps}>
      {steps.map(({ title, description }, index) => (
        <View key={title} style={styles.step}>
          <StepNumber number={index + 1} size={numberSize} />
          <View style={styles.stepText}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.stepDescription, { color: theme.textMuted }]}>
              {description}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  number: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  numberMd: {
    width: spacing["2xl"],
    height: spacing["2xl"],
  },
  numberSm: {
    width: spacing.xl,
    height: spacing.xl,
  },
  numberLabel: {
    fontFamily: fontFamily.semibold,
  },
  numberLabelMd: {
    fontSize: fontSize.sm,
  },
  numberLabelSm: {
    fontSize: fontSize.xs,
  },
  steps: {
    gap: spacing.xl,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  stepText: {
    flex: 1,
    gap: spacing.xs,
  },
  stepTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
  },
  stepDescription: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },
});
