import { router } from "expo-router";
import { ArrowLeft, X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

type LessonScreenProps = {
  /** "close" leaves the lesson; "back" returns to the previous lesson step. */
  leading: "close" | "back";
  /** Shows a progress bar and "n of total" next to the leading button. */
  progress?: { current: number; total: number };
  /** A primary button pinned to the bottom of the screen. */
  action?: { label: string; onPress: () => void };
  /** Custom content pinned to the bottom instead of `action` (e.g. grade buttons). */
  footer?: ReactNode;
  /** Accessibility label for the close button. */
  closeLabel?: string;
  /** "Word 3 of 5" by default; reviews pass their own noun. */
  progressNoun?: string;
  children: ReactNode;
};

/**
 * The frame shared by every screen in the lesson modal: a top bar, scrolling
 * content, and an optional primary button pinned to the bottom.
 */
export function LessonScreen({
  leading,
  progress,
  action,
  footer,
  closeLabel = "Close lesson",
  progressNoun = "Word",
  children,
}: LessonScreenProps) {
  const { theme } = useTheme();
  // Not <SafeAreaView>: inside an iOS full-screen modal it reports a top inset
  // of 0, putting the top bar under the status bar. The modal covers the whole
  // window, so the root provider's window insets are the right ones.
  const insets = useSafeAreaInsets();

  // A full-screen modal can't be swiped away on iOS, so this is the way out.
  // dismissTo unwinds to Home, or replaces this screen with Home when Home
  // isn't in the history (e.g. the lesson was opened from a deep link).
  const handleLeading =
    leading === "close" ? () => router.dismissTo("/home") : () => router.back();
  const LeadingIcon = leading === "close" ? X : ArrowLeft;

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
          accessibilityLabel={leading === "close" ? closeLabel : "Back"}
          hitSlop={spacing.sm}
          onPress={handleLeading}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { backgroundColor: theme.surface },
          ]}
        >
          <LeadingIcon color={theme.textMuted} size={iconSize.lg} />
        </Pressable>

        {progress ? (
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`${progressNoun} ${progress.current} of ${progress.total}`}
            style={styles.progress}
          >
            <View
              style={[styles.progressTrack, { backgroundColor: theme.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.accent,
                    width: `${(progress.current / progress.total) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
              {progress.current} of {progress.total}
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>{children}</View>
      </ScrollView>

      {footer ? <View style={styles.footer}>{footer}</View> : null}

      {action && !footer ? (
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed ? theme.accentPressed : theme.accent,
              },
            ]}
          >
            <Text style={[styles.buttonLabel, { color: theme.onAccent }]}>
              {action.label}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: radius.full,
  },
  progress: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: spacing.xs,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
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
