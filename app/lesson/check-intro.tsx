import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { GradeGuide } from "@/components/grade-guide";
import { LessonScreen } from "@/components/lesson-screen";
import { type NumberedStep, NumberedSteps } from "@/components/numbered-steps";
import { fontFamily, fontSize, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { isFirstLesson } from "@/lib/lesson-session";

const STEPS: readonly NumberedStep[] = [
  {
    title: "Recall the meaning",
    description: "You'll see each word you just met. Think of what it means.",
  },
  {
    title: "Show the answer",
    description: "Tap Show answer to check yourself.",
  },
  {
    title: "Say how it went",
    description: "Did you remember it? Tap Again or Good.",
  },
];

/**
 * Between a lesson's words and its quick check, so the change is never a
 * surprise: until now Next and Back moved through the words, and from here
 * the buttons grade them. The first lesson explains the quick check in full;
 * later lessons get a one-line reminder.
 *
 * What the guide says Again and Good do matches the scheduler for every
 * recall target: a first Again comes back the next day, a first Good in a
 * few days (see `lib/srs/scheduler.ts`), and Again also gets a practice
 * round at the end of the check (see `check.tsx`).
 */
export default function QuickCheckIntroScreen() {
  const { theme } = useTheme();
  const full = isFirstLesson();

  return (
    <LessonScreen
      leading="back"
      action={{
        label: "Start quick check",
        onPress: () => router.push("/lesson/check"),
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Quick check</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {full
            ? "Now see what you remember."
            : "Recall each word's meaning, then tap Again or Good."}
        </Text>
      </View>

      {full ? (
        <>
          <NumberedSteps steps={STEPS} />
          <GradeGuide
            again="You didn't remember it. You'll see it once more at the end, then again tomorrow."
            good="You remembered it. It comes back in a few days."
          />
          <Text style={[styles.note, { color: theme.textMuted }]}>
            Be honest: your answers decide when each word comes back for
            review.
          </Text>
        </>
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
    fontFamily: fontFamily.regular,
  },
  note: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },
});
