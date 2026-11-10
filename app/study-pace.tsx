import { Stack } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChoiceSection } from "@/components/choice-section";
import {
  DAILY_REVIEW_LIMIT_OPTIONS,
  DESIRED_RETENTION_OPTIONS,
  LESSON_WORD_COUNT,
  NEW_WORDS_PER_DAY_OPTIONS,
  REVIEW_ESTIMATED_SECONDS,
} from "@/constants/lesson";
import { maxContentWidth, spacing } from "@/constants/theme";
import { useProgress } from "@/hooks/use-progress";
import { useTheme } from "@/hooks/use-theme";
import {
  type DesiredRetention,
  setDailyReviewLimit,
  setDesiredRetention,
  setNewWordsPerDay,
} from "@/lib/progress";
import { plural } from "@/utils/format";

const NEW_WORDS_CHOICES = NEW_WORDS_PER_DAY_OPTIONS.map((count) => ({
  value: count,
  label: plural(count, "word", "words"),
  detail: plural(count / LESSON_WORD_COUNT, "lesson", "lessons"),
}));

const REVIEW_LIMIT_CHOICES = DAILY_REVIEW_LIMIT_OPTIONS.map((limit) =>
  limit === null
    ? { value: limit, label: "No limit" }
    : {
        value: limit,
        label: plural(limit, "review", "reviews"),
        detail: `About ${Math.round((limit * REVIEW_ESTIMATED_SECONDS) / 60)} min`,
      },
);

const RETENTION_DETAILS: Record<DesiredRetention, string> = {
  0.85: "Fewer reviews",
  0.9: "Balanced",
  0.95: "More reviews",
};

const RETENTION_CHOICES = DESIRED_RETENTION_OPTIONS.map((retention) => ({
  value: retention,
  label: `${Math.round(retention * 100)}%`,
  detail: RETENTION_DETAILS[retention],
}));

/**
 * Study pace, opened from Settings: the scheduling settings (new words a day,
 * daily review limit, recall target). They affect each other, so they share a
 * screen. Each says what it does and what it costs; raw FSRS parameters are
 * never shown, and the defaults suit most beginners.
 */
export default function StudyPaceScreen() {
  const { theme } = useTheme();
  const { newWordsPerDay, dailyReviewLimit, desiredRetention } = useProgress();

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Study pace",
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: theme.text,
          headerStyle: { backgroundColor: theme.background },
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <ChoiceSection
            title="New words a day"
            footnote="Each new word comes back for reviews over the following weeks, so more new words today means more reviews later. 10 is a steady pace for most beginners."
            choices={NEW_WORDS_CHOICES}
            selected={newWordsPerDay}
            onSelect={setNewWordsPerDay}
          />

          <ChoiceSection
            title="Daily review limit"
            footnote="Keeps busy days short. Reviews over the limit wait until tomorrow, and a word reviewed late is a little harder to remember."
            choices={REVIEW_LIMIT_CHOICES}
            selected={dailyReviewLimit}
            onSelect={setDailyReviewLimit}
          />

          <ChoiceSection
            title="Recall target"
            footnote="How likely you are to remember a word when it comes back. Higher means more reviews; lower means fewer reviews but more forgetting. 90% suits most learners. Changes apply from each word's next review."
            choices={RETENTION_CHOICES}
            selected={desiredRetention}
            onSelect={setDesiredRetention}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: spacing.xl,
    gap: spacing["2xl"],
  },
});
