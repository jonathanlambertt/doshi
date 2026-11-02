import { router } from "expo-router";
import { X } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  LESSON_ESTIMATED_MINUTES,
  LESSON_WORD_COUNT,
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
import { useTheme } from "@/hooks/use-theme";

type Step = {
  title: string;
  description: string;
};

const STEPS: readonly Step[] = [
  {
    title: "Meet each word",
    description: "See its reading, its meaning, and an example sentence.",
  },
  {
    title: "Quick check",
    description: "Recall the words you just met.",
  },
];

/**
 * Intro to the user's first lesson, opened as a full-screen modal from Home.
 * Sets expectations before any words appear: how many, how long, and what
 * happens in a lesson.
 */
export default function LessonIntroScreen() {
  const { theme } = useTheme();
  // Not <SafeAreaView>: inside an iOS full-screen modal it reports a top inset
  // of 0, putting the close button under the status bar. The modal covers the
  // whole window, so the root provider's window insets are the right ones.
  const insets = useSafeAreaInsets();

  // A full-screen modal can't be swiped away on iOS, so this is the way out.
  // Opened from a deep link there is nothing to go back to, so go Home instead.
  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  };

  // Intentionally empty — the next step (asking whether the user reads kana)
  // isn't built yet.
  const handleBegin = () => {};

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close lesson"
          hitSlop={spacing.sm}
          onPress={handleClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && { backgroundColor: theme.surface },
          ]}
        >
          <X color={theme.textMuted} size={iconSize.lg} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              Your first lesson
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              {LESSON_WORD_COUNT} new words · about {LESSON_ESTIMATED_MINUTES}{" "}
              min
            </Text>
          </View>

          <View style={styles.steps}>
            {STEPS.map(({ title, description }, index) => (
              <View key={title} style={styles.step}>
                <View
                  style={[
                    styles.stepNumber,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.stepNumberLabel, { color: theme.text }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    {title}
                  </Text>
                  <Text
                    style={[styles.stepDescription, { color: theme.textMuted }]}
                  >
                    {description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={[styles.note, { color: theme.textMuted }]}>
            Words you learn come back for review just before you&apos;d forget
            them.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={handleBegin}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? theme.accentPressed : theme.accent },
          ]}
        >
          <Text style={[styles.buttonLabel, { color: theme.onAccent }]}>
            Begin
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    alignSelf: "center",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeButton: {
    alignSelf: "flex-start",
    padding: spacing.sm,
    borderRadius: radius.full,
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
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
  },
  steps: {
    gap: spacing.xl,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  stepNumber: {
    width: spacing["2xl"],
    height: spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  stepNumberLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
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
  note: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },
  footer: {
    alignSelf: "center",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  buttonLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
});
