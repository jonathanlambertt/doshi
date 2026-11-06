import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GradeButtons } from "@/components/grade-buttons";
import { LessonScreen } from "@/components/lesson-screen";
import { PrimaryButton } from "@/components/primary-button";
import { RecallCard } from "@/components/recall-card";
import {
  fontFamily,
  fontSize,
  letterSpacing,
  spacing,
} from "@/constants/theme";
import { useShowsRomaji } from "@/hooks/use-reading-level";
import { useTheme } from "@/hooks/use-theme";
import { getProgress, recordGrade } from "@/lib/progress";
import type { Grade } from "@/lib/srs/scheduler";
import { dueWords } from "@/lib/today";
import { plural } from "@/utils/format";

/**
 * A review session: every word due today, most overdue first. Each grade is
 * sent to FSRS and saved immediately, so closing midway keeps what was done.
 */
export default function ReviewScreen() {
  const { theme } = useTheme();
  const romaji = useShowsRomaji();
  // Fixed when the session starts, so grading doesn't reshuffle the queue.
  const [queue] = useState(() => dueWords(getProgress()));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [remembered, setRemembered] = useState(0);

  const word = queue[index];
  const finished = index >= queue.length;

  const handleGrade = (grade: Grade) => {
    // A second tap can land on the grade buttons after the last word was
    // graded but before the finished screen replaces them; ignore it rather
    // than grading a word past the end of the queue.
    if (!word) return;
    recordGrade(word.id, grade, "review");
    if (grade === "good") setRemembered((count) => count + 1);
    setIndex((current) => current + 1);
    setRevealed(false);
  };

  const close = () => router.dismissTo("/home");

  if (queue.length === 0) {
    return (
      <LessonScreen
        leading="close"
        closeLabel="Close reviews"
        action={{ label: "Done", onPress: close }}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          Nothing to review
        </Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          No words are due right now.
        </Text>
      </LessonScreen>
    );
  }

  if (finished) {
    return (
      <LessonScreen
        leading="close"
        closeLabel="Close reviews"
        action={{ label: "Done", onPress: close }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Reviews done
          </Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            You reviewed {plural(queue.length, "word", "words")} and remembered{" "}
            {remembered}.
          </Text>
        </View>
        {remembered < queue.length ? (
          <Text style={[styles.body, { color: theme.textMuted }]}>
            The ones you missed come back tomorrow.
          </Text>
        ) : null}
      </LessonScreen>
    );
  }

  return (
    <LessonScreen
      leading="close"
      closeLabel="Close reviews"
      progressNoun="Review"
      progress={{ current: index + 1, total: queue.length }}
      footer={
        revealed ? (
          <GradeButtons onGrade={handleGrade} />
        ) : (
          <PrimaryButton label="Show answer" onPress={() => setRevealed(true)} />
        )
      }
    >
      <Text style={[styles.eyebrow, { color: theme.textMuted }]}>Review</Text>
      <RecallCard word={word} revealed={revealed} showRomaji={romaji} />
    </LessonScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
    textAlign: "center",
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  body: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
  },
});
