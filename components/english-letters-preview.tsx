import { StyleSheet, Text, View } from "react-native";

import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// 私 (I), the first word of the first lesson.
const SAMPLE = { word: "私", reading: "わたし", letters: "watashi" } as const;

type EnglishLettersPreviewProps = {
  /** The setting's current value: whether the letters line shows. */
  show: boolean;
};

/**
 * A sample card showing what the English letters (romaji) setting does: the
 * line under the Japanese shows only while the switch below is on. Off, the
 * line keeps its space, so flipping the switch doesn't move the switch.
 *
 * Drawn as the top of a grouped card: the switch row underneath draws the
 * divider, the sides and the bottom (in Settings, a `ListRow` that isn't
 * `first`).
 */
export function EnglishLettersPreview({ show }: EnglishLettersPreviewProps) {
  const { theme } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={
        show
          ? "Example word, with English letters under it"
          : "Example word, without English letters"
      }
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {/* No fontFamily on Japanese text: Figtree has no Japanese glyphs. */}
      <Text lang="ja" style={[styles.word, { color: theme.text }]}>
        {SAMPLE.word}
      </Text>
      <Text lang="ja" style={[styles.reading, { color: theme.text }]}>
        {SAMPLE.reading}
      </Text>
      <Text
        style={[
          styles.letters,
          { color: theme.textSubtle },
          !show && styles.hidden,
        ]}
      >
        {SAMPLE.letters}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderLeftWidth: StyleSheet.hairlineWidth * 2,
    borderRightWidth: StyleSheet.hairlineWidth * 2,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  // A smaller version of a word card's lines.
  word: {
    fontSize: fontSize.xl,
  },
  reading: {
    fontSize: fontSize.md,
  },
  letters: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.wide,
  },
  hidden: {
    opacity: 0,
  },
});
