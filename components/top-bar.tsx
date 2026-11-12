import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { iconSize, maxContentWidth, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * The top of a screen that hides the native header: a back button. It goes
 * to the landing screen when there's nothing to go back to (e.g. the screen
 * was opened from a deep link).
 */
export function TopBar() {
  const { theme } = useTheme();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={spacing.sm}
        onPress={handleBack}
        style={({ pressed }) => [
          styles.button,
          pressed && { backgroundColor: theme.surface },
        ]}
      >
        <ArrowLeft color={theme.textMuted} size={iconSize.lg} />
      </Pressable>
    </View>
  );
}

// Same position and size as the lesson screens' top bar.
const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignSelf: "center",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  button: {
    padding: spacing.sm,
    borderRadius: radius.full,
  },
});
