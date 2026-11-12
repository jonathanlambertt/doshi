import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TopBar } from "@/components/top-bar";
import {
  fontFamily,
  fontSize,
  maxContentWidth,
  spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Pinned to the bottom of the screen, e.g. a way to skip signing up. */
  footer?: ReactNode;
};

/**
 * The frame shared by sign-in, account creation and the email code screen: a
 * back button, a title, and content that stays above the keyboard.
 */
export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
}: AuthScreenProps) {
  const { theme } = useTheme();
  // Insets instead of <SafeAreaView>: KeyboardAvoidingView measures itself
  // against its parent, so the parent must start at the top of the window
  // and run to its bottom edge.
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <TopBar />

      {/* Expo apps are edge-to-edge on Android, so the window no longer
          resizes for the keyboard: both platforms need a behavior. */}
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                {title}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                {subtitle}
              </Text>
            </View>
            {children}
          </View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    paddingBottom: spacing.xl,
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
    fontFamily: fontFamily.regular,
  },
  // Sits at the bottom of the screen, or under the content when it's taller.
  footer: {
    marginTop: "auto",
    alignSelf: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
});
