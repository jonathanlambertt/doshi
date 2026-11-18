import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { EnglishLettersPreview } from "@/components/english-letters-preview";
import { LessonScreen } from "@/components/lesson-screen";
import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  spacing,
} from "@/constants/theme";
import {
  defaultRomaji,
  type ReadingLevel,
  setReadingLevel,
  setRomaji,
} from "@/hooks/use-reading-level";
import { useTheme } from "@/hooks/use-theme";
import { isFirstLesson } from "@/lib/lesson-session";

type Option = {
  level: ReadingLevel;
  label: string;
};

const OPTIONS: readonly Option[] = [
  { level: "fluent", label: "Yes, I can read these" },
  { level: "some", label: "A little" },
  { level: "none", label: "Not yet" },
];

// Simple hiragana words to test with: cat, water, book.
const SAMPLE_KANA = ["ねこ", "みず", "ほん"] as const;

/**
 * Asked once, in the first lesson: can the user read hiragana? The answer
 * sets whether cards show English letters (romaji) under the Japanese, and
 * the user can keep (or drop) them regardless before continuing, with a
 * sample card showing the effect. Both can be changed later in Settings.
 */
export default function KanaQuestionScreen() {
  const { theme } = useTheme();
  const [level, setLevel] = useState<ReadingLevel | null>(null);
  const [romaji, setRomajiChoice] = useState(true);

  // Each answer suggests a default; the switch below can override it.
  const handleChoose = (choice: ReadingLevel) => {
    setLevel(choice);
    setRomajiChoice(defaultRomaji(choice));
  };

  // In the first lesson, how to read a card comes before the words.
  const handleContinue = () => {
    if (!level) return;
    setReadingLevel(level);
    setRomaji(romaji);
    router.push(isFirstLesson() ? "/lesson/card-guide" : "/lesson/words");
  };

  return (
    <LessonScreen
      leading="back"
      action={
        level ? { label: "Continue", onPress: handleContinue } : undefined
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Can you read hiragana?
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Each word&apos;s sound can also be spelled in English letters, under
          the Japanese. You can keep them on whatever your answer.
        </Text>
      </View>

      <View
        accessible
        accessibilityLabel={`Examples: ${SAMPLE_KANA.join(", ")}`}
        style={[
          styles.samples,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {SAMPLE_KANA.map((kana) => (
          <Text key={kana} lang="ja" style={[styles.sample, { color: theme.text }]}>
            {kana}
          </Text>
        ))}
      </View>

      <View style={styles.options}>
        {OPTIONS.map((option) => {
          const selected = option.level === level;
          return (
            <Pressable
              key={option.level}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => handleChoose(option.level)}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: selected ? theme.text : theme.borderStrong,
                  backgroundColor:
                    pressed || selected ? theme.surface : theme.background,
                },
              ]}
            >
              <Text style={[styles.optionLabel, { color: theme.text }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {level ? (
        <View>
          <EnglishLettersPreview show={romaji} />
          <View
            style={[
              styles.romajiRow,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text
              style={[
                styles.optionLabel,
                styles.romajiLabel,
                { color: theme.text },
              ]}
            >
              Show English letters
            </Text>
            <Switch
              accessibilityLabel="Show English letters"
              value={romaji}
              onValueChange={setRomajiChoice}
              trackColor={{ true: theme.accent, false: theme.borderStrong }}
            />
          </View>
        </View>
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
  samples: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  // No fontFamily: Figtree has no Japanese glyphs, so this uses the system font.
  sample: {
    fontSize: fontSize.xl,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  // The bottom of a grouped card under the sample card: its top border is
  // the divider between them.
  romajiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  romajiLabel: {
    flex: 1,
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
});
