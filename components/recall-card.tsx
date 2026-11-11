import { StyleSheet, Text, View } from "react-native";

import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  spacing,
} from "@/constants/theme";
import type { DictionaryWord } from "@/data/dictionary-words";
import { useTheme } from "@/hooks/use-theme";

type RecallCardProps = {
  word: DictionaryWord;
  /** The meaning only appears once the answer is shown. */
  revealed: boolean;
  showRomaji: boolean;
};

/**
 * One word in a quick check or review. The front shows the word and its
 * reading; the user recalls the meaning, then reveals it to check themselves.
 */
export function RecallCard({ word, revealed, showRomaji }: RecallCardProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text lang="ja" style={[styles.word, { color: theme.text }]}>
          {word.word}
        </Text>
        {word.reading !== word.word ? (
          <Text lang="ja" style={[styles.reading, { color: theme.text }]}>
            {word.reading}
          </Text>
        ) : null}
        {showRomaji ? (
          <Text style={[styles.romaji, { color: theme.textSubtle }]}>
            {word.romaji}
          </Text>
        ) : null}
      </View>

      {revealed ? (
        <View
          style={[
            styles.answer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.meaning, { color: theme.text }]}>
            {word.meaning}
          </Text>
        </View>
      ) : (
        <Text style={[styles.prompt, { color: theme.textMuted }]}>
          Do you remember what it means?
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  hero: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  // No fontFamily on Japanese text: Figtree has no Japanese glyphs.
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
  prompt: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
  answer: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: spacing.sm,
    alignItems: "center",
  },
  meaning: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
    textAlign: "center",
  },
});
