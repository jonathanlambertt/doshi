import { Stack } from "expo-router";

import { useTheme } from "@/hooks/use-theme";

// The lesson's own stack, presented as a full-screen modal by the root layout.
// Steps push inside it, so the ✕ on any step closes the whole lesson.
export default function LessonLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}
