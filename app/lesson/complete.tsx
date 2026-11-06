import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { LessonScreen } from "@/components/lesson-screen";
import { fontFamily, fontSize, spacing } from "@/constants/theme";
import { useProgress } from "@/hooks/use-progress";
import { useTheme } from "@/hooks/use-theme";
import { getLessonWords } from "@/lib/lesson-session";
import { now } from "@/lib/progress";
import { formatTimeUntil, plural } from "@/utils/format";

/**
 * End of a lesson: how many words were learned and when they come back.
 * Done returns Home, closing the whole lesson.
 */
export default function LessonCompleteScreen() {
  const { theme } = useTheme();
  const progress = useProgress();

  const learned = getLessonWords()
    .map((word) => progress.cards.get(word.id))
    .filter((stored) => stored !== undefined);
  const firstReview = learned.reduce<Date | null>(
    (earliest, stored) =>
      !earliest || stored.card.dueAt < earliest ? stored.card.dueAt : earliest,
    null,
  );

  return (
    <LessonScreen
      leading="close"
      action={{ label: "Done", onPress: () => router.dismissTo("/home") }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Lesson complete
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          You learned {plural(learned.length, "new word", "new words")}.
        </Text>
      </View>
      {firstReview ? (
        <Text style={[styles.note, { color: theme.textMuted }]}>
          Doshi will bring{" "}
          {learned.length === 1 ? "it" : "them"} back for review just before
          you&apos;d forget — the first {formatTimeUntil(firstReview, now())}.
        </Text>
      ) : null}
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
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
  },
});
