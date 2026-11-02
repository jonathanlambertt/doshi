import { router } from "expo-router";
import { ChevronRight, Search, X } from "lucide-react-native";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toHiragana } from "wanakana";

import {
  fontFamily,
  fontSize,
  iconSize,
  maxContentWidth,
  radius,
  spacing,
} from "@/constants/theme";
import { getRomaji, SAMPLE_WORDS, type Word } from "@/data/sample-words";
import { useTheme } from "@/hooks/use-theme";

/**
 * Matches the word, its reading, or its English meaning. Readings also match
 * romaji two ways: against the reading's romaji, so partial input like "nek"
 * finds ねこ, and via the query converted to hiragana, so other spellings
 * ("si" for し) and katakana input (ネコ) work too.
 */
function matches(word: Word, query: string, kanaQuery: string) {
  return (
    word.expression.includes(query) ||
    word.reading.includes(query) ||
    word.reading.includes(kanaQuery) ||
    getRomaji(word).includes(query) ||
    word.meaning.toLowerCase().includes(query)
  );
}

/**
 * Test dictionary screen: the words a user has learned so far, with a search
 * that filters as you type. Tapping a row opens the word's detail screen.
 */
export default function DictionaryScreen() {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const kanaQuery = toHiragana(normalizedQuery);
  const results = normalizedQuery
    ? SAMPLE_WORDS.filter((word) => matches(word, normalizedQuery, kanaQuery))
    : SAMPLE_WORDS;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Dictionary</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {SAMPLE_WORDS.length} words learned
          </Text>
        </View>

        <View
          style={[
            styles.search,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Search color={theme.textSubtle} size={iconSize.md} />
          <TextInput
            accessibilityLabel="Search your words"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search in Japanese or English"
            placeholderTextColor={theme.textSubtle}
            returnKeyType="search"
            value={query}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {query ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              hitSlop={spacing.sm}
              onPress={() => setQuery("")}
            >
              <X color={theme.textSubtle} size={iconSize.md} />
            </Pressable>
          ) : null}
        </View>

        {results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(word) => word.id}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <Pressable
                accessibilityLabel={`${item.expression}, ${item.reading}, ${item.meaning}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/word/[id]",
                    params: { id: item.id },
                  })
                }
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed ? theme.background : theme.surface,
                    borderColor: theme.border,
                  },
                  index === 0 && styles.rowFirst,
                  index === results.length - 1 && styles.rowLast,
                ]}
              >
                <View style={styles.rowJapanese}>
                  <Text
                    lang="ja"
                    style={[styles.expression, { color: theme.text }]}
                  >
                    {item.expression}
                  </Text>
                  <Text
                    lang="ja"
                    style={[styles.reading, { color: theme.textMuted }]}
                  >
                    {item.reading}
                  </Text>
                </View>
                <View style={styles.rowEnglish}>
                  <Text style={[styles.meaning, { color: theme.text }]}>
                    {item.meaning}
                  </Text>
                  <Text
                    style={[styles.partOfSpeech, { color: theme.textSubtle }]}
                  >
                    {item.partOfSpeech}
                  </Text>
                </View>
                <ChevronRight color={theme.textSubtle} size={iconSize.md} />
              </Pressable>
            )}
          />
        ) : (
          <Text style={[styles.noResults, { color: theme.textMuted }]}>
            No words match “{query.trim()}”.
          </Text>
        )}
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
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  // Rows share one rounded, bordered card. Every row draws its sides and a top
  // border (the divider above it); the first and last round the card's corners
  // and the last closes the bottom edge.
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.md,
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
  rowJapanese: {
    flex: 1,
    gap: spacing.xs,
  },
  // Japanese text sets no fontFamily: Figtree has no Japanese glyphs.
  expression: {
    fontSize: fontSize.lg,
  },
  reading: {
    fontSize: fontSize.sm,
  },
  rowEnglish: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  meaning: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
  },
  partOfSpeech: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
  },
  noResults: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
});
