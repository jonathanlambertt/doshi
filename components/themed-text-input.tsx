import { type ComponentProps } from "react";
import { Platform, TextInput } from "react-native";

import { useTheme } from "@/hooks/use-theme";

/**
 * A TextInput that matches the app's light or dark mode. Use it for every
 * text field. Props passed in override these defaults.
 */
export function ThemedTextInput(props: ComponentProps<typeof TextInput>) {
  const { scheme, theme } = useTheme();

  return (
    <TextInput
      // Otherwise the iOS keyboard and the cursor keep the system defaults.
      // iOS tints the cursor with selectionColor. Android uses cursorColor
      // and would paint selectionColor solid over selected text, so
      // selectionColor is set on iOS only.
      keyboardAppearance={scheme}
      cursorColor={theme.text}
      selectionColor={Platform.OS === "ios" ? theme.text : undefined}
      placeholderTextColor={theme.textSubtle}
      {...props}
    />
  );
}
