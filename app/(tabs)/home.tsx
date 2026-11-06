import { router } from "expo-router";
import {
  CalendarCheck,
  type LucideIcon,
  NotebookPen,
  RotateCcw,
} from "lucide-react-native";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  LESSON_ESTIMATED_MINUTES,
  LESSON_WORD_COUNT,
  NEW_WORDS_PER_DAY,
  REVIEW_ESTIMATED_SECONDS,
} from "@/constants/lesson";
import {
  fontFamily,
  fontSize,
  iconSize,
  letterSpacing,
  maxContentWidth,
  radius,
  spacing,
} from "@/constants/theme";
import { useProgress } from "@/hooks/use-progress";
import { useTheme } from "@/hooks/use-theme";
import { hasLearnedEverything, useToday } from "@/hooks/use-today";
import { advanceTime, now, resetProgress } from "@/lib/progress";
import { formatTimeUntil, plural } from "@/utils/format";

type Step = {
  title: string;
  description: string;
};

const STEPS: readonly Step[] = [
  {
    title: "Learn new words",
    description:
      "Each lesson introduces a few words with their reading and meaning.",
  },
  {
    title: "Review at the right time",
    description: "Doshi brings words back just before you'd forget them.",
  },
  {
    title: "Grow at a steady pace",
    description: "A few minutes a day builds your vocabulary.",
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Home: always leads with the next thing to do. Reviews come first because
 * they protect words already learned; new-word lessons follow, up to the daily
 * limit. A brand-new user instead sees their first lesson and how Doshi works.
 */
export default function HomeScreen() {
  const { theme } = useTheme();
  const today = useToday();

  const isFirstLesson = today.wordsLearned === 0;
  const learnedEverything = hasLearnedEverything(today);
  const hasReviews = today.reviewsDue > 0;
  const hasLesson = !learnedEverything && today.newWordsLeftToday > 0;
  const lessonSize = Math.min(LESSON_WORD_COUNT, today.newWordsLeftToday);
  const reviewMinutes = Math.max(
    1,
    Math.round((today.reviewsDue * REVIEW_ESTIMATED_SECONDS) / 60),
  );

  const handleStartLesson = () => router.push("/lesson");
  const handleStartReviews = () => router.push("/review");

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.text }]}>Doshi</Text>
              {isFirstLesson ? (
                // "Welcome."
                <Text
                  lang="ja"
                  style={[styles.subtitle, { color: theme.textMuted }]}
                >
                  ようこそ。
                </Text>
              ) : (
                <Text
                  style={[
                    styles.subtitle,
                    styles.subtitleLatin,
                    { color: theme.textMuted },
                  ]}
                >
                  {plural(today.wordsLearned, "word", "words")} learned
                </Text>
              )}
            </View>
          </View>

          {isFirstLesson ? (
            <ActionCard
              eyebrow="Your first lesson!"
              title={`There are ${plural(lessonSize, "new word", "new words")} to learn`}
              action={{
                label: "Start your first lesson",
                icon: NotebookPen,
                onPress: handleStartLesson,
              }}
            />
          ) : (
            <>
              {hasReviews ? (
                <ActionCard
                  eyebrow="Reviews"
                  title={`${plural(today.reviewsDue, "word", "words")} to review`}
                  detail={`About ${reviewMinutes} min`}
                  action={{
                    label: "Start reviews",
                    icon: RotateCcw,
                    onPress: handleStartReviews,
                  }}
                />
              ) : null}

              {hasLesson ? (
                <ActionCard
                  eyebrow="Next lesson"
                  title={plural(lessonSize, "new word", "new words")}
                  detail={
                    hasReviews
                      ? "Best done after your reviews"
                      : `About ${LESSON_ESTIMATED_MINUTES} min · ${today.newWordsLeftToday} of ${NEW_WORDS_PER_DAY} new words left today`
                  }
                  action={{
                    label: "Start lesson",
                    icon: NotebookPen,
                    onPress: handleStartLesson,
                    // Reviews take the primary button when both are available.
                    secondary: hasReviews,
                  }}
                />
              ) : null}

              {!hasReviews && !hasLesson ? (
                <ActionCard
                  icon={CalendarCheck}
                  eyebrow="All done for today"
                  title={
                    learnedEverything
                      ? "You've met every word"
                      : `You've learned today's ${NEW_WORDS_PER_DAY} new words`
                  }
                  detail={
                    today.nextReviewAt
                      ? `Your next review is ${formatTimeUntil(today.nextReviewAt, now())}.`
                      : undefined
                  }
                />
              ) : null}

              {hasReviews && !hasLesson ? (
                <Text style={[styles.note, { color: theme.textMuted }]}>
                  {learnedEverything
                    ? "You've met every word in the list. Reviews keep them fresh."
                    : `You've learned today's ${NEW_WORDS_PER_DAY} new words. More tomorrow.`}
                </Text>
              ) : null}

              {!hasReviews && hasLesson && today.nextReviewAt ? (
                <Text style={[styles.note, { color: theme.textMuted }]}>
                  Your next review is{" "}
                  {formatTimeUntil(today.nextReviewAt, now())}.
                </Text>
              ) : null}
            </>
          )}

          {isFirstLesson ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                How Doshi works
              </Text>
              {STEPS.map(({ title, description }) => (
                <View key={title} style={styles.step}>
                  <Text
                    aria-hidden
                    style={[styles.stepTitle, { color: theme.textMuted }]}
                  >
                    •
                  </Text>
                  <View style={styles.stepText}>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>
                      {title}
                    </Text>
                    <Text
                      style={[
                        styles.stepDescription,
                        { color: theme.textMuted },
                      ]}
                    >
                      {description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {__DEV__ ? <DevTools /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ActionCardProps = {
  eyebrow: string;
  title: string;
  detail?: string;
  /** Shown beside the eyebrow; used by cards without a button. */
  icon?: LucideIcon;
  action?: {
    label: string;
    icon: LucideIcon;
    onPress: () => void;
    /** Outlined instead of filled, when another card holds the main action. */
    secondary?: boolean;
  };
};

function ActionCard({ eyebrow, title, detail, icon: Icon, action }: ActionCardProps) {
  const { theme } = useTheme();
  const ActionIcon = action?.icon;
  const actionColor = action?.secondary ? theme.text : theme.onAccent;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.eyebrowRow}>
        {Icon ? <Icon color={theme.textMuted} size={iconSize.md} /> : null}
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
          {eyebrow}
        </Text>
      </View>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      {detail ? (
        <Text style={[styles.cardDetail, { color: theme.textMuted }]}>
          {detail}
        </Text>
      ) : null}
      {action && ActionIcon ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.button,
            action.secondary
              ? {
                  borderWidth: StyleSheet.hairlineWidth * 2,
                  borderColor: theme.borderStrong,
                  backgroundColor: pressed ? theme.background : theme.surface,
                }
              : {
                  backgroundColor: pressed ? theme.accentPressed : theme.accent,
                },
          ]}
        >
          <ActionIcon color={actionColor} size={iconSize.md} />
          <Text style={[styles.buttonLabel, { color: actionColor }]}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Dev only: move the app's clock forward so reviews come due without waiting,
 * or wipe all progress to start again as a new user.
 */
function DevTools() {
  const { theme } = useTheme();
  const { timeOffsetMs } = useProgress();
  const current = now();
  const offsetDays = Math.round(timeOffsetMs / DAY_MS);
  const time = `${current.toDateString()} ${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`;

  const confirmReset = () =>
    Alert.alert(
      "Reset progress?",
      "Deletes every learned word, all review history and the kana answer, and resets the clock.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetProgress },
      ],
    );

  return (
    <View style={[styles.devTools, { borderColor: theme.border }]}>
      <Text style={[styles.devTitle, { color: theme.textMuted }]}>
        Developer tools
      </Text>
      <Text style={[styles.devTime, { color: theme.textMuted }]}>
        App time: {time}
        {offsetDays > 0 ? ` (+${plural(offsetDays, "day", "days")})` : ""}
      </Text>
      <View style={styles.devButtons}>
        <DevButton label="+1 day" onPress={() => advanceTime(DAY_MS)} />
        <DevButton label="+1 week" onPress={() => advanceTime(7 * DAY_MS)} />
        <DevButton label="Reset progress" onPress={confirmReset} />
      </View>
    </View>
  );
}

function DevButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.devButton,
        {
          borderColor: theme.borderStrong,
          backgroundColor: pressed ? theme.surface : theme.background,
        },
      ]}
    >
      <Text style={[styles.devButtonLabel, { color: theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    alignSelf: "center",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  headerText: {
    flexShrink: 1,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  // No fontFamily here: Figtree has no Japanese glyphs, so the greeting uses
  // the system font. The English subtitle adds Figtree at the same size.
  subtitle: {
    fontSize: fontSize.md,
  },
  subtitleLatin: {
    fontFamily: fontFamily.regular,
  },
  card: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: spacing.sm,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
  },
  cardDetail: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  buttonLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  note: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
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
  devTools: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    gap: spacing.sm,
  },
  devTitle: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  devTime: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
  },
  devButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  devButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  devButtonLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
  },
});
