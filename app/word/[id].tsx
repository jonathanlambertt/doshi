import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fontFamily,
  fontSize,
  letterSpacing,
  maxContentWidth,
  radius,
  spacing,
} from "@/constants/theme";
import { getRomaji, getWord } from "@/data/sample-words";
import { useTheme } from "@/hooks/use-theme";

/**
 * Test word detail screen, opened from a Dictionary row. Shows the word large
 * with its reading and romaji, then its meaning and one example sentence.
 */
export default function WordDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const word = getWord(id);

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
                {word.expression}
              </Text>
              <Text lang="ja" style={[styles.reading, { color: theme.text }]}>
                {word.reading}
              </Text>
              <Text style={[styles.romaji, { color: theme.textSubtle }]}>
                {getRomaji(word)}
              </Text>
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
              <View style={[styles.pill, { borderColor: theme.borderStrong }]}>
                <Text style={[styles.pillLabel, { color: theme.textMuted }]}>
                  {word.partOfSpeech}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.label, { color: theme.textMuted }]}>
                Example
              </Text>
              <Text
                lang="ja"
                style={[styles.exampleJapanese, { color: theme.text }]}
              >
                {word.example.japanese}
              </Text>
              <Text
                lang="ja"
                style={[styles.exampleReading, { color: theme.textMuted }]}
              >
                {word.example.reading}
              </Text>
              <Text style={[styles.exampleEnglish, { color: theme.textMuted }]}>
                {word.example.english}
              </Text>
            </View>

            <Text style={[styles.status, { color: theme.textSubtle }]}>
              Learned in your first lesson
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
  pill: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  pillLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
  },
  exampleJapanese: {
    fontSize: fontSize.lg,
  },
  exampleReading: {
    fontSize: fontSize.sm,
  },
  exampleEnglish: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
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
