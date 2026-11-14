import { Tabs } from "expo-router/js-tabs";
import { BookBookmark, House, Settings } from "lucide-react-native";

import { fontFamily, fontSize, iconSize } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// The app itself, reached from "Try without an account" on account creation
// or at the end of the tour, which clears the history so Back can't return to
// the landing screens. Once that choice is saved, the app opens here (see
// app/index.tsx).
export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textSubtle,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: fontSize.xs,
        },
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <House color={color} size={iconSize.lg} />,
        }}
      />
      <Tabs.Screen
        name="dictionary"
        options={{
          title: "Dictionary",
          tabBarIcon: ({ color }) => (
            <BookBookmark color={color} size={iconSize.lg} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Settings color={color} size={iconSize.lg} />
          ),
        }}
      />
    </Tabs>
  );
}
