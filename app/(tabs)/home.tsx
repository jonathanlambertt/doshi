import { router } from "expo-router";
import { NotebookPen } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LESSON_WORD_COUNT } from "@/constants/lesson";
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
    title: "Learn new words",
    description:
      "Each lesson introduces a few words with their reading and meaning.",
  },
  {
    title: "Review at the right time",
    description: "Doshi brings words back just before you'd forget them.",
  },
  {
    title: "Grow at a steady pace",
    description: "A few minutes a day builds your vocabulary.",
  },
];

/**
 * Test home screen for a brand-new signed-in user: no progress yet, so it leads
 * with the first lesson and explains how the app works.
 */
export default function HomeScreen() {
  const { theme } = useTheme();

  const handleStartLesson = () => router.push("/lesson");

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Doshi</Text>
            {/* "Welcome! Let's do our best together." */}
            <Text
              lang="ja"
              style={[styles.subtitle, { color: theme.textMuted }]}
            >
              ようこそ。
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
              Your first lesson!
            </Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              There are {LESSON_WORD_COUNT} new words to learn
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleStartLesson}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: pressed ? theme.accentPressed : theme.accent,
                },
              ]}
            >
              <NotebookPen color={theme.onAccent} size={iconSize.md} />
              <Text style={[styles.buttonLabel, { color: theme.onAccent }]}>
                Start your first lesson
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              How Doshi works
            </Text>
            {STEPS.map(({ title, description }) => (
              <View key={title} style={styles.step}>
                <Text
                  aria-hidden
                  style={[styles.stepTitle, { color: theme.textMuted }]}
                >
                  •
                </Text>
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
    paddingVertical: spacing["2xl"],
    gap: spacing["2xl"],
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  // No fontFamily: Figtree has no Japanese glyphs, so this uses the system font.
  subtitle: {
    fontSize: fontSize.md,
  },
  card: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
    marginBottom: spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  buttonLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
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
});
