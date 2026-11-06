import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

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

type Option = {
  level: ReadingLevel;
  label: string;
};

const OPTIONS: readonly Option[] = [
  { level: "fluent", label: "Yes, I can read these" },
  { level: "some", label: "A little" },
  { level: "none", label: "Not yet" },
];

// Readings of words from the first lesson: cat, water, book.
const SAMPLE_KANA = ["ねこ", "みず", "ほん"] as const;

/**
 * Asked once, in the first lesson: can the user read hiragana? The answer
 * sets whether cards show romaji alongside the Japanese, and the user can
 * keep (or drop) romaji regardless before continuing. Both can be changed
 * later in Settings.
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

  const handleContinue = () => {
    if (!level) return;
    setReadingLevel(level);
    setRomaji(romaji);
    router.push("/lesson/words");
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
          Romaji (Latin letters) can be shown alongside the Japanese. You can
          keep it on whatever your answer.
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
        <View
          style={[
            styles.romajiRow,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.romajiText}>
            <Text style={[styles.optionLabel, { color: theme.text }]}>
              Show romaji
            </Text>
            <Text style={[styles.romajiHint, { color: theme.textMuted }]}>
              neko · mizu · hon
            </Text>
          </View>
          <Switch
            accessibilityLabel="Show romaji"
            value={romaji}
            onValueChange={setRomajiChoice}
            trackColor={{ true: theme.accent, false: theme.borderStrong }}
          />
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
  romajiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  romajiText: {
    flex: 1,
    gap: spacing.xs,
  },
  romajiHint: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
});
