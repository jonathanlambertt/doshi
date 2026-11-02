import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fontFamily,
  fontSize,
  iconSize,
  maxContentWidth,
  radius,
  spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/**
 * A full tab screen with nothing in it yet: an icon, a title, and one line
 * explaining what will appear here. The bottom inset is left to the tab bar.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Icon color={theme.textMuted} size={iconSize.xl} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.textMuted }]}>
          {description}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconCircle: {
    padding: spacing.xl,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
    textAlign: "center",
  },
  description: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
});
