import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExampleSentence } from "@/components/example-sentence";

import {
  fontFamily,
  fontSize,
  letterSpacing,
  maxContentWidth,
  radius,
  spacing,
} from "@/constants/theme";
import { getDictionaryWord } from "@/data/dictionary-words";
import { useProgress } from "@/hooks/use-progress";
import { useShowsRomaji } from "@/hooks/use-reading-level";
import { useTheme } from "@/hooks/use-theme";
import type { StoredCard } from "@/lib/db";
import { now } from "@/lib/progress";
import { isDue } from "@/lib/srs/day";
import { formatTimeUntil } from "@/utils/format";

/**
 * Word detail, opened from a Dictionary row: the word large with its reading
 * (and romaji for learners still on kana), its meaning, an example sentence,
 * and where it stands in the user's reviews. This is the only screen that
 * shows example sentences: lessons and reviews leave them out.
 */
export default function WordDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const word = getDictionaryWord(id);
  const romaji = useShowsRomaji();
  const stored = useProgress().cards.get(id);

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: theme.text,
          headerStyle: { backgroundColor: theme.background },
        }}
      />

      {word ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.hero}>
              <Text
                lang="ja"
                style={[styles.expression, { color: theme.text }]}
              >
                {word.word}
              </Text>
              {/* Kana-only words (あなた) would repeat themselves. */}
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
              <Text style={[styles.label, { color: theme.textMuted }]}>
                Meaning
              </Text>
              <Text style={[styles.meaning, { color: theme.text }]}>
                {word.meaning}
              </Text>
            </View>

            {word.sentence ? (
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.label, { color: theme.textMuted }]}>
                  Example
                </Text>
                <ExampleSentence sentence={word.sentence} />
              </View>
            ) : null}

            <Text style={[styles.status, { color: theme.textSubtle }]}>
              {reviewStatus(stored)}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.notFound}>
          <Text style={[styles.notFoundLabel, { color: theme.textMuted }]}>
            This word isn&apos;t in your dictionary.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function reviewStatus(stored: StoredCard | undefined) {
  if (!stored) return "Not learned yet";
  const current = now();
  if (isDue(stored.card.dueAt, current)) return "Due for review today";
  return `Next review ${formatTimeUntil(stored.card.dueAt, current)}`;
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
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
    gap: spacing.xl,
  },
  hero: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  // Japanese text sets no fontFamily: Figtree has no Japanese glyphs.
  expression: {
    fontSize: fontSize.display,
  },
  reading: {
    fontSize: fontSize.lg,
  },
  romaji: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
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
  status: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  notFoundLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
});
