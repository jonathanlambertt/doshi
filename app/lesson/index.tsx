import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { LessonScreen } from "@/components/lesson-screen";
import { type NumberedStep, NumberedSteps } from "@/components/numbered-steps";
import {
  LESSON_ESTIMATED_MINUTES,
  LESSON_WORD_COUNT,
} from "@/constants/lesson";
import { fontFamily, fontSize, spacing } from "@/constants/theme";
import { getReadingLevel } from "@/hooks/use-reading-level";
import { useTheme } from "@/hooks/use-theme";
import { useToday } from "@/hooks/use-today";
import { isFirstLesson, startLesson } from "@/lib/lesson-session";
import { plural } from "@/utils/format";

const STEPS: readonly NumberedStep[] = [
  {
    title: "Meet each word",
    description: "See its reading and its meaning.",
  },
  {
    title: "Quick check",
    description: "Recall each word, then say if you remembered it.",
  },
];

/**
 * Intro to a lesson, opened as a full-screen modal from Home. Sets
 * expectations before any words appear: how many, how long, and what
 * happens in a lesson.
 */
export default function LessonIntroScreen() {
  const { theme } = useTheme();
  const today = useToday();
  const size = Math.min(LESSON_WORD_COUNT, today.newWordsLeftToday);

  // The kana question comes first, the first time. The first lesson then
  // shows how to read a card (card-guide.tsx) before its words.
  const handleBegin = () => {
    startLesson();
    if (getReadingLevel() === null) {
      router.push("/lesson/kana");
    } else if (isFirstLesson()) {
      router.push("/lesson/card-guide");
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
          {today.wordsLearned === 0 ? "Your first lesson" : "Next lesson"}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {size > 0
            ? `${plural(size, "new word", "new words")} · about ${LESSON_ESTIMATED_MINUTES} min`
            : "No new words left today. Come back tomorrow."}
        </Text>
      </View>

      <NumberedSteps steps={STEPS} />

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
  note: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },
});
