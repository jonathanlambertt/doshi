import { router, useNavigation } from "expo-router";
import { Undo2 } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { GradeButtons } from "@/components/grade-buttons";
import { LessonScreen } from "@/components/lesson-screen";
import { PrimaryButton } from "@/components/primary-button";
import { RecallCard } from "@/components/recall-card";
import { fontFamily, fontSize, letterSpacing } from "@/constants/theme";
import type { DictionaryWord } from "@/data/dictionary-words";
import { useShowsRomaji } from "@/hooks/use-reading-level";
import { useTheme } from "@/hooks/use-theme";
import { getLessonWords } from "@/lib/lesson-session";
import { type GradeRecord, recordGrade, undoGrade } from "@/lib/progress";
import type { Grade } from "@/lib/srs/scheduler";

type Item = {
  word: DictionaryWord;
  /** A practice round for a word graded Again; not sent to FSRS. */
  practice: boolean;
};

/** Where the check was before a step, and the grade that step made, if any. */
type Step = {
  queue: readonly Item[];
  index: number;
  /** Null for a practice round, which isn't graded. */
  record: GradeRecord | null;
};

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * The lesson's quick check: recall each new word, then grade it. That first
 * grade starts the word in FSRS and is saved immediately. A word graded Again
 * comes back once more at the end as practice — not graded, since FSRS has
 * already scheduled it for tomorrow.
 *
 * Undo steps back one word at a time, taking its grade back, so a mis-tap can
 * be fixed. Going back from Lesson complete undoes the last step the same way.
 */
export default function QuickCheckScreen() {
  const { theme } = useTheme();
  const romaji = useShowsRomaji();
  const navigation = useNavigation();
  // Shuffled so recall doesn't lean on the order the words were taught in.
  const [queue, setQueue] = useState<readonly Item[]>(() =>
    shuffle(getLessonWords()).map((word) => ({ word, practice: false })),
  );
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [steps, setSteps] = useState<readonly Step[]>([]);
  // Set when the last step opens Lesson complete; this screen stays underneath.
  const completed = useRef(false);

  const item = queue[index];

  const advance = (nextQueue: readonly Item[], record: GradeRecord | null) => {
    if (completed.current) return;
    setSteps((current) => [...current, { queue, index, record }]);
    if (index + 1 >= nextQueue.length) {
      // Pushed rather than replaced, so going back returns here. The last word
      // stays on screen underneath, which is where undo lands.
      completed.current = true;
      router.push("/lesson/complete");
      return;
    }
    setQueue(nextQueue);
    setIndex(index + 1);
    setRevealed(false);
  };

  const handleGrade = (grade: Grade) => {
    // A second tap can land after the last step has opened Lesson complete.
    if (completed.current) return;
    const record = recordGrade(item.word.id, grade, "lesson");
    advance(
      grade === "again"
        ? [...queue, { word: item.word, practice: true }]
        : queue,
      record,
    );
  };

  // Back to the previous word with its answer showing, ready to regrade.
  const handleUndo = useCallback(() => {
    const last = steps[steps.length - 1];
    if (!last) return;
    if (last.record) undoGrade(last.record);
    setSteps(steps.slice(0, -1));
    setQueue(last.queue);
    setIndex(last.index);
    setRevealed(true);
  }, [steps]);

  // Returning from Lesson complete (its Undo, or a back gesture) undoes the
  // step that finished the check. This listens for the focus event itself, not
  // useFocusEffect: that re-runs whenever its callback changes while the screen
  // counts as focused, and router.push only navigates after the next render —
  // so the last grade's re-render would undo that grade straight away.
  useEffect(
    () =>
      navigation.addListener("focus", () => {
        if (!completed.current) return;
        completed.current = false;
        handleUndo();
      }),
    [navigation, handleUndo],
  );

  if (!item) {
    return (
      <LessonScreen leading="close">
        <Text style={[styles.message, { color: theme.textMuted }]}>
          There&apos;s no lesson in progress.
        </Text>
      </LessonScreen>
    );
  }

  const footer = !revealed ? (
    <PrimaryButton label="Show answer" onPress={() => setRevealed(true)} />
  ) : item.practice ? (
    <PrimaryButton label="Continue" onPress={() => advance(queue, null)} />
  ) : (
    <GradeButtons onGrade={handleGrade} />
  );

  return (
    <LessonScreen
      leading="close"
      progress={{ current: index + 1, total: queue.length }}
      trailingAction={
        steps.length > 0
          ? { icon: Undo2, label: "Undo last answer", onPress: handleUndo }
          : undefined
      }
      footer={footer}
    >
      <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
        {item.practice ? "One more time" : "Quick check"}
      </Text>
      <RecallCard word={item.word} revealed={revealed} showRomaji={romaji} />
    </LessonScreen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
    textAlign: "center",
  },
  message: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
});
