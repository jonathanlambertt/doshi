import Constants from "expo-constants";
import { Stack } from "expo-router";
import { Check } from "lucide-react-native";
import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListRow, ListSection } from "@/components/list-row";
import { iconSize, maxContentWidth, spacing } from "@/constants/theme";
import {
  type ReadingLevel,
  setReadingLevel,
  setRomaji,
  useReadingLevel,
  useShowsRomaji,
} from "@/hooks/use-reading-level";
import { useTheme } from "@/hooks/use-theme";

type Option = {
  level: ReadingLevel;
  label: string;
};

// Same answers as the kana question in the first lesson.
const READING_OPTIONS: readonly Option[] = [
  { level: "fluent", label: "I can read hiragana" },
  { level: "some", label: "I can read a little" },
  { level: "none", label: "I can't read it yet" },
];

/**
 * App settings, opened from Profile. For now: how well the user reads kana,
 * whether romaji is shown (independent of reading level), and the version.
 */
export default function SettingsScreen() {
  const { theme } = useTheme();
  const readingLevel = useReadingLevel();
  const romaji = useShowsRomaji();
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Settings",
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: theme.text,
          headerStyle: { backgroundColor: theme.background },
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <ListSection title="Hiragana">
            {READING_OPTIONS.map(({ level, label }, index) => {
              const selected = readingLevel === level;
              return (
                <ListRow
                  key={level}
                  label={label}
                  accessibilityRole="radio"
                  selected={selected}
                  onPress={() => setReadingLevel(level)}
                  trailing={
                    selected ? (
                      <Check color={theme.text} size={iconSize.md} />
                    ) : null
                  }
                  first={index === 0}
                  last={index === READING_OPTIONS.length - 1}
                />
              );
            })}
          </ListSection>

          <ListSection
            title="Romaji"
            footnote="Latin letters under each word (neko for ねこ). Keep them on as long as they help, whatever your reading level."
          >
            <ListRow
              label="Show romaji"
              accessibilityRole="switch"
              selected={romaji}
              onPress={() => setRomaji(!romaji)}
              trailing={
                <Switch
                  accessibilityLabel="Show romaji"
                  value={romaji}
                  onValueChange={setRomaji}
                  trackColor={{ true: theme.accent, false: theme.borderStrong }}
                />
              }
              first
              last
            />
          </ListSection>

          {version ? (
            <ListSection title="About">
              <ListRow label="Version" value={version} first last />
            </ListSection>
          ) : null}
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
    paddingVertical: spacing.xl,
    gap: spacing["2xl"],
  },
});
