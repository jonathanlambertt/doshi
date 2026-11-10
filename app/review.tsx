import { router } from "expo-router";
import { Undo2 } from "lucide-react-native";
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
import { useToday } from "@/hooks/use-today";
import {
  getProgress,
  type GradeRecord,
  recordGrade,
  undoGrade,
} from "@/lib/progress";
import type { Grade } from "@/lib/srs/scheduler";
import { dueWords } from "@/lib/today";
import { plural } from "@/utils/format";

type Graded = { grade: Grade; record: GradeRecord };

/**
 * A review session: the words due today, most overdue first, up to the daily
 * review limit. Each grade is sent to FSRS and saved immediately, so closing
 * midway keeps what was done. Undo steps back one word at a time, taking its
 * grade back, so a mis-tap can be fixed.
 */
export default function ReviewScreen() {
  const { theme } = useTheme();
  const romaji = useShowsRomaji();
  const { reviewsHeldBack } = useToday();
  const limitNote =
    reviewsHeldBack > 0
      ? `You've reached today's review limit. ${plural(reviewsHeldBack, "word waits", "words wait")} until tomorrow.`
      : null;
  // Fixed when the session starts, so grading doesn't reshuffle the queue.
  const [queue] = useState(() => dueWords(getProgress()));
  // One entry per word graded this session, in order; the next word to show
  // is the one after the last graded.
  const [graded, setGraded] = useState<readonly Graded[]>([]);
  const [revealed, setRevealed] = useState(false);

  const index = graded.length;
  const word = queue[index];
  const finished = index >= queue.length;
  const remembered = graded.filter(({ grade }) => grade === "good").length;

  const handleGrade = (grade: Grade) => {
    // A second tap can land on the grade buttons after the last word was
    // graded but before the finished screen replaces them; ignore it rather
    // than grading a word past the end of the queue.
    if (!word) return;
    const record = recordGrade(word.id, grade, "review");
    setGraded((current) => [...current, { grade, record }]);
    setRevealed(false);
  };

  // Back to the last graded word with its answer showing, ready to regrade.
  const handleUndo = () => {
    const last = graded[graded.length - 1];
    if (!last) return;
    undoGrade(last.record);
    setGraded(graded.slice(0, -1));
    setRevealed(true);
  };

  const undoAction =
    graded.length > 0
      ? { icon: Undo2, label: "Undo last answer", onPress: handleUndo }
      : undefined;

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
          {limitNote ?? "No words are due right now."}
        </Text>
      </LessonScreen>
    );
  }

  if (finished) {
    return (
      <LessonScreen
        leading="close"
        closeLabel="Close reviews"
        trailingAction={undoAction}
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
        {limitNote ? (
          <Text style={[styles.body, { color: theme.textMuted }]}>
            {limitNote}
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
      trailingAction={undoAction}
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
