import { router } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LessonScreen } from "@/components/lesson-screen";
import {
  type NumberedStep,
  NumberedSteps,
  StepNumber,
} from "@/components/numbered-steps";
import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  spacing,
} from "@/constants/theme";
import { DICTIONARY_WORDS, type DictionaryWord } from "@/data/dictionary-words";
import { useShowsRomaji } from "@/hooks/use-reading-level";
import { useTheme } from "@/hooks/use-theme";
import { getLessonWords } from "@/lib/lesson-session";

const PARTS: readonly NumberedStep[] = [
  {
    title: "The word",
    description: "As it's usually written, often with kanji.",
  },
  {
    title: "Its reading",
    description: "How to say it, in hiragana.",
  },
  {
    title: "English letters",
    description: "The reading, spelled in the English alphabet.",
  },
];

/**
 * Cards show a word's reading only when it differs from the word, so a word
 * written just as it's read (あなた) has one Japanese line instead of two.
 */
function hasReadingLine(word: DictionaryWord) {
  return word.reading !== word.word;
}

/** The first word in `words`, else in the whole list, that matches. */
function findExample(
  words: readonly DictionaryWord[],
  matches: (word: DictionaryWord) => boolean,
) {
  return words.find(matches) ?? DICTIONARY_WORDS.find(matches);
}

/**
 * How to read a card, shown once: in the first lesson, after the kana
 * question and before the first word. It numbers the lines of an example —
 * the lesson's own first word (私) — and explains each, then shows a word
 * with no reading line (あなた), which the same lesson has too. English
 * letters (romaji) are left out for users who've turned them off.
 */
export default function CardGuideScreen() {
  const { theme } = useTheme();
  const romaji = useShowsRomaji();
  const lessonWords = getLessonWords();
  const example = findExample(lessonWords, hasReadingLine);
  const kanaExample = findExample(lessonWords, (word) => !hasReadingLine(word));
  const parts = romaji ? PARTS : PARTS.slice(0, 2);

  return (
    <LessonScreen
      leading="back"
      action={{
        label: "Continue",
        onPress: () => router.push("/lesson/words"),
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          How to read a card
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Each new word is shown like this.
        </Text>
      </View>

      {example ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ExampleLine number={1}>
            <Text lang="ja" style={[styles.word, { color: theme.text }]}>
              {example.word}
            </Text>
          </ExampleLine>
          <ExampleLine number={2}>
            <Text lang="ja" style={[styles.reading, { color: theme.text }]}>
              {example.reading}
            </Text>
          </ExampleLine>
          {romaji ? (
            <ExampleLine number={3}>
              <Text style={[styles.romaji, { color: theme.textSubtle }]}>
                {example.romaji}
              </Text>
            </ExampleLine>
          ) : null}
        </View>
      ) : null}

      <NumberedSteps steps={parts} numberSize="sm" />

      {kanaExample ? (
        <View style={styles.note}>
          <View
            style={[
              styles.noteCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text lang="ja" style={[styles.noteWord, { color: theme.text }]}>
              {kanaExample.word}
            </Text>
          </View>
          <Text style={[styles.noteText, { color: theme.textMuted }]}>
            Some words, like this one, are written just as they&apos;re read,
            so their cards have no separate reading.
          </Text>
        </View>
      ) : null}
    </LessonScreen>
  );
}

/**
 * One line of the example card: centered like on a real card, with its
 * number at the right edge.
 */
function ExampleLine({
  number,
  children,
}: {
  number: number;
  children: ReactNode;
}) {
  return (
    <View style={styles.line}>
      <View style={styles.lineSide} />
      {children}
      <View style={[styles.lineSide, styles.lineNumber]}>
        <StepNumber number={number} size="sm" />
      </View>
    </View>
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
  card: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: spacing.sm,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
  },
  lineSide: {
    flex: 1,
  },
  lineNumber: {
    alignItems: "flex-end",
  },
  // The same sizes as the word screen. No fontFamily on Japanese text:
  // Figtree has no Japanese glyphs, so it uses the system font.
  word: {
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
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  noteCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  noteWord: {
    fontSize: fontSize.lg,
  },
  noteText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },
});
