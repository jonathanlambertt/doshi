import { router } from "expo-router";
import { ChevronRight, LogOut, Mail, Settings, Trash } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListRow, ListSection } from "@/components/list-row";
import {
  fontFamily,
  fontSize,
  iconSize,
  maxContentWidth,
  spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// Placeholder — there is no auth yet, so no real signed-in user.
const PLACEHOLDER_EMAIL = "you@example.com";

// Test-only sign out: return to the landing screen. Falls back to replace when
// there is nothing to dismiss (e.g. /profile opened directly on web).
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
 * Test profile screen: a link to Settings and the Account section. Progress is
 * expected to join it later.
 */
export default function ProfileScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>

          <ListSection title="App">
            <ListRow
              icon={Settings}
              label="Settings"
              onPress={() => router.push("/settings")}
              trailing={
                <ChevronRight color={theme.textSubtle} size={iconSize.md} />
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
});
