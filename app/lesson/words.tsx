import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";

import { LessonScreen } from "@/components/lesson-screen";
import { PrimaryButton, SecondaryButton } from "@/components/primary-button";
import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  spacing,
} from "@/constants/theme";
import { useShowsRomaji } from "@/hooks/use-reading-level";
import { useTheme } from "@/hooks/use-theme";
import { getLessonWords } from "@/lib/lesson-session";

/**
 * The lesson's new words, one at a time on a single screen — like the quick
 * check and reviews, Next swaps the word in place rather than pushing a new
 * screen. Each word is shown all at once: this is the user's first sight of
 * it, not a test. Romaji appears under the word unless the user said they
 * read hiragana. A word with a Doshi note (さん) shows it as "Note" under
 * the meaning. Back returns to the previous word.
 */
export default function LessonWordsScreen() {
  const { theme } = useTheme();
  const romaji = useShowsRomaji();
  // Fixed for the session, like the quick check's queue.
  const [words] = useState(getLessonWords);
  const [index, setIndex] = useState(0);

  const word = words[index];
  const total = words.length;
  const isLast = index + 1 >= total;
  const canGoBack = index > 0;

  const handleBack = () => setIndex((current) => Math.max(0, current - 1));

  // Android's back button steps back through the words too, and only leaves
  // this screen from the first one. Only while this screen is showing: back
  // handlers run newest first, so one left on underneath the quick check
  // would take that screen's back presses.
  useFocusEffect(
    useCallback(() => {
      if (!canGoBack) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          handleBack();
          return true;
        },
      );
      return () => subscription.remove();
    }, [canGoBack]),
  );

  // After the last word, the quick check's intro explains what comes next.
  const handleNext = () => {
    if (isLast) {
      router.push("/lesson/check-intro");
    } else {
      setIndex(index + 1);
    }
  };

  if (!word) {
    return (
      <LessonScreen leading="close">
        <Text style={[styles.notFound, { color: theme.textMuted }]}>
          There&apos;s no lesson in progress.
        </Text>
      </LessonScreen>
    );
  }

  return (
    <LessonScreen
      leading="close"
      progress={{ current: index + 1, total }}
      footer={
        <View style={styles.footer}>
          {canGoBack ? (
            <View style={styles.footerButton}>
              <SecondaryButton label="Back" onPress={handleBack} />
            </View>
          ) : null}
          <View style={styles.footerButton}>
            <PrimaryButton
              label={isLast ? "Continue" : "Next"}
              onPress={handleNext}
            />
          </View>
        </View>
      }
    >
      {/* The iOS swipe-back would skip every word back to the intro; past the
          first word, use the Back button instead. */}
      <Stack.Screen options={{ gestureEnabled: !canGoBack }} />
      <View style={styles.hero}>
        <Text lang="ja" style={[styles.expression, { color: theme.text }]}>
          {word.word}
        </Text>
        {word.reading !== word.word ? (
          <Text lang="ja" style={[styles.reading, { color: theme.text }]}>
            {word.reading}
          </Text>
        ) : null}
        {romaji ? (
          <Text style={[styles.romaji, { color: theme.textSubtle }]}>
            {word.romaji}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.label, { color: theme.textMuted }]}>Meaning</Text>
        <Text style={[styles.meaning, { color: theme.text }]}>
          {word.meaning}
        </Text>
      </View>

      {word.doshiNote ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Note
          </Text>
          <Text style={[styles.note, { color: theme.text }]}>
            {word.doshiNote}
          </Text>
        </View>
      ) : null}
    </LessonScreen>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
  hero: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  // No fontFamily on Japanese text: Figtree has no Japanese glyphs, so it
  // uses the system font.
  expression: {
    fontSize: fontSize.display,
  },
  reading: {
    fontSize: fontSize.lg,
  },
  romaji: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.wide,
  },
  card: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  meaning: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
  },
  note: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
  },
  notFound: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
});
