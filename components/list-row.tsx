import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontFamily, fontSize, iconSize, letterSpacing, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ListRowProps = {
  icon?: LucideIcon;
  label: string;
  value?: string;
  /** Shown at the trailing edge, after `value` (e.g. a chevron or checkmark). */
  trailing?: ReactNode;
  onPress?: () => void;
  /** For radio- and switch-style rows; announced to screen readers. */
  selected?: boolean;
  accessibilityRole?: "button" | "radio" | "switch";
  first?: boolean;
  last?: boolean;
};

/** One row of a grouped card; pressable when `onPress` is given. */
export function ListRow({
  icon: Icon,
  label,
  value,
  trailing,
  onPress,
  selected,
  accessibilityRole = "button",
  first,
  last,
}: ListRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? accessibilityRole : undefined}
      accessibilityState={selected === undefined ? undefined : { checked: selected }}
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
      {Icon ? <Icon color={theme.textMuted} size={iconSize.md} /> : null}
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      {value ? (
        <Text numberOfLines={1} style={[styles.value, { color: theme.textMuted }]}>
          {value}
        </Text>
      ) : null}
      {trailing ? <View>{trailing}</View> : null}
    </Pressable>
  );
}

type ListSectionProps = {
  /** Omit for a group that needs no heading, e.g. a single navigation row. */
  title?: string;
  /** Small print under the card. */
  footnote?: string;
  children: ReactNode;
};

/** A group of `ListRow`s, usually titled. */
export function ListSection({ title, footnote, children }: ListSectionProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      {title ? (
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
      ) : null}
      <View>{children}</View>
      {footnote ? (
        <Text style={[styles.footnote, { color: theme.textMuted }]}>{footnote}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
    paddingHorizontal: spacing.lg,
  },
  footnote: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
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
  label: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
  },
  value: {
    flexShrink: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
  },
});
