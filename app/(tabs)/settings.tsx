import Constants from "expo-constants";
import { router } from "expo-router";
import { Check, LogOut, Mail, Trash } from "lucide-react-native";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListRow, ListSection } from "@/components/list-row";
import {
  fontFamily,
  fontSize,
  iconSize,
  maxContentWidth,
  spacing,
} from "@/constants/theme";
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

// Placeholder — there is no auth yet, so no real signed-in user.
const PLACEHOLDER_EMAIL = "you@example.com";

// Test-only sign out: return to the landing screen. Falls back to replace when
// there is nothing to dismiss (e.g. the app was deep-linked straight to this tab).
const handleSignOut = () => {
  if (router.canDismiss()) {
    router.dismissAll();
  } else {
    router.replace("/");
  }
};

// Intentionally empty — needs a confirmation step and a backend. Apple requires
// in-app account deletion for any app that lets users create an account.
const handleDeleteAccount = () => {};

/**
 * Settings tab: how well the user reads kana, whether romaji is shown
 * (independent of reading level), the Account section, and the app version.
 */
export default function SettingsScreen() {
  const { theme } = useTheme();
  const readingLevel = useReadingLevel();
  const romaji = useShowsRomaji();
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

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

          <ListSection title="Account">
            <ListRow icon={Mail} label="Email" value={PLACEHOLDER_EMAIL} first />
            <ListRow icon={LogOut} label="Sign out" onPress={handleSignOut} />
            {/* Neutral on purpose: destructive colors are undecided, and the
                Rose accent must not stand in for them. */}
            <ListRow
              icon={Trash}
              label="Delete account"
              onPress={handleDeleteAccount}
              last
            />
          </ListSection>

          {version ? (
            <Text style={[styles.version, { color: theme.textSubtle }]}>
              Version {version}
            </Text>
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
    paddingVertical: spacing["2xl"],
    gap: spacing["2xl"],
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  version: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
});
