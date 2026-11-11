import { Stack } from "expo-router";
import { ExternalLink } from "lucide-react-native";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListRow, ListSection } from "@/components/list-row";
import { iconSize, maxContentWidth, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const KAISHI_URL = "https://github.com/donkuri/Kaishi";

/** Credits, opened from Settings: the Kaishi 1.5k deck, and nothing else. */
export default function CreditsScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Credits",
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          headerTintColor: theme.text,
          headerStyle: { backgroundColor: theme.background },
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <ListSection footnote={KAISHI_URL}>
            <ListRow
              label="Kaishi 1.5k by donkuri"
              onPress={() => Linking.openURL(KAISHI_URL)}
              trailing={
                <ExternalLink color={theme.textSubtle} size={iconSize.md} />
              }
              first
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
    paddingVertical: spacing.xl,
    gap: spacing["2xl"],
  },
});
