import { StyleSheet, Text, View } from "react-native";

import {
  fontFamily,
  fontSize,
  japaneseFontWeight,
  spacing,
} from "@/constants/theme";
import type {
  ExampleSentence as Sentence,
  SentenceSegment,
} from "@/data/dictionary-words";
import { useTheme } from "@/hooks/use-theme";

type Unit =
  | { kind: "break" }
  | { kind: "text"; text: string; reading?: string; highlight: boolean };

/**
 * Splits segments into the pieces a line can wrap between: each kanji run
 * with its reading stays whole, and plain text breaks between any two
 * characters, as Japanese does.
 */
function toUnits(segments: readonly SentenceSegment[]): Unit[] {
  return segments.flatMap((segment): Unit[] => {
    const highlight = segment.highlight ?? false;
    if (segment.reading !== undefined) {
      return [
        { kind: "text", text: segment.text, reading: segment.reading, highlight },
      ];
    }
    return Array.from(segment.text).map((char) =>
      char === "\n"
        ? { kind: "break" }
        : { kind: "text", text: char, highlight },
    );
  });
}

/**
 * An example sentence: the Japanese with furigana over its kanji and the word
 * it illustrates in bold, then the English translation.
 */
export function ExampleSentence({ sentence }: { sentence: Sentence }) {
  const { theme } = useTheme();
  const units = toUnits(sentence.segments);

  return (
    <View style={styles.container}>
      {/* Read as one sentence by screen readers, not unit by unit. */}
      <View
        accessible
        accessibilityLabel={sentence.text}
        accessibilityLanguage="ja"
        style={styles.japanese}
      >
        {units.map((unit, index) =>
          unit.kind === "break" ? (
            <View key={index} style={styles.lineBreak} />
          ) : (
            <View key={index} style={styles.unit}>
              {unit.reading !== undefined ? (
                <Text
                  lang="ja"
                  style={[
                    styles.reading,
                    { color: theme.textMuted },
                    unit.highlight && styles.highlight,
                  ]}
                >
                  {unit.reading}
                </Text>
              ) : null}
              <Text
                lang="ja"
                style={[
                  styles.text,
                  { color: theme.text },
                  unit.highlight && styles.highlight,
                ]}
              >
                {unit.text}
              </Text>
            </View>
          ),
        )}
      </View>
      <Text style={[styles.translation, { color: theme.textMuted }]}>
        {sentence.translation}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  japanese: {
    flexDirection: "row",
    flexWrap: "wrap",
    // Units with furigana are taller; line every unit up on the text.
    alignItems: "flex-end",
    rowGap: spacing.sm,
  },
  unit: {
    alignItems: "center",
  },
  lineBreak: {
    width: "100%",
  },
  // Japanese text sets no fontFamily: Figtree has no Japanese glyphs.
  reading: {
    fontSize: fontSize.xs,
  },
  text: {
    fontSize: fontSize.lg,
  },
  highlight: {
    fontWeight: japaneseFontWeight.bold,
  },
  translation: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
  },
});
