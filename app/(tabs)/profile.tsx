import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { LogOut, Mail, Trash } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

type RowProps = {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  first?: boolean;
  last?: boolean;
};

/** One row of a grouped card; pressable when `onPress` is given. */
function Row({ icon: Icon, label, value, onPress, first, last }: RowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.background : theme.surface,
          borderColor: theme.border,
        },
        first && styles.rowFirst,
        last && styles.rowLast,
      ]}
    >
      <Icon color={theme.textMuted} size={iconSize.md} />
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {value ? (
        <Text
          numberOfLines={1}
          style={[styles.rowValue, { color: theme.textMuted }]}
        >
          {value}
        </Text>
      ) : null}
    </Pressable>
  );
}

/**
 * Test profile screen. For now it only holds the Account section; progress and
 * settings are expected to join it later.
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

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
              Account
            </Text>
            <View>
              <Row icon={Mail} label="Email" value={PLACEHOLDER_EMAIL} first />
              <Row icon={LogOut} label="Sign out" onPress={handleSignOut} />
              {/* Neutral on purpose: destructive colors are undecided, and the
                  Rose accent must not stand in for them. */}
              <Row
                icon={Trash}
                label="Delete account"
                onPress={handleDeleteAccount}
                last
              />
            </View>
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
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
    paddingHorizontal: spacing.lg,
  },
  // Same grouped-card construction as the Dictionary list: every row draws its
  // sides and a top divider; the first and last round the corners and the last
  // closes the bottom edge.
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderLeftWidth: StyleSheet.hairlineWidth * 2,
    borderRightWidth: StyleSheet.hairlineWidth * 2,
  },
  rowFirst: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  rowLast: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  rowLabel: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
  },
  rowValue: {
    flexShrink: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
  },
});
