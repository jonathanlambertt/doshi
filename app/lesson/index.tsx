import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { LessonScreen } from "@/components/lesson-screen";
import {
  LESSON_ESTIMATED_MINUTES,
  LESSON_WORD_COUNT,
} from "@/constants/lesson";
import { fontFamily, fontSize, radius, spacing } from "@/constants/theme";
import { getReadingLevel } from "@/hooks/use-reading-level";
import { useTheme } from "@/hooks/use-theme";
import { useToday } from "@/hooks/use-today";
import { startLesson } from "@/lib/lesson-session";
import { plural } from "@/utils/format";

type Step = {
  title: string;
  description: string;
};

const STEPS: readonly Step[] = [
  {
    title: "Meet each word",
    description: "See its reading and its meaning.",
  },
  {
    title: "Quick check",
    description: "Recall the words you just met.",
  },
];

/**
 * Intro to the user's first lesson, opened as a full-screen modal from Home.
 * Sets expectations before any words appear: how many, how long, and what
 * happens in a lesson.
 */
export default function LessonIntroScreen() {
  const { theme } = useTheme();
  const today = useToday();
  const isFirstLesson = today.wordsLearned === 0;
  const size = Math.min(LESSON_WORD_COUNT, today.newWordsLeftToday);

  // Ask about kana once, the first time; after that go straight to the words.
  const handleBegin = () => {
    startLesson();
    if (getReadingLevel() === null) {
      router.push("/lesson/kana");
    } else {
      router.push("/lesson/words");
    }
  };

  return (
    <LessonScreen
      leading="close"
      action={size > 0 ? { label: "Begin", onPress: handleBegin } : undefined}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {isFirstLesson ? "Your first lesson" : "Next lesson"}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {size > 0
            ? `${plural(size, "new word", "new words")} · about ${LESSON_ESTIMATED_MINUTES} min`
            : "No new words left today. Come back tomorrow."}
        </Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map(({ title, description }, index) => (
          <View key={title} style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.stepNumberLabel, { color: theme.text }]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.stepText}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                {title}
              </Text>
              <Text
                style={[styles.stepDescription, { color: theme.textMuted }]}
              >
                {description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.note, { color: theme.textMuted }]}>
        Words you learn come back for review just before you&apos;d forget
        them.
      </Text>
    </LessonScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
  },
  steps: {
    gap: spacing.xl,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  stepNumber: {
    width: spacing["2xl"],
    height: spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  stepNumberLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
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
  note: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },
});
