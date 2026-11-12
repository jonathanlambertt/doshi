import { router } from "expo-router";
import { BookBookmark, ChevronRight, Search, X } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toHiragana } from "wanakana";

import { EmptyState } from "@/components/empty-state";
import { ThemedTextInput } from "@/components/themed-text-input";
import {
  fontFamily,
  fontSize,
  iconSize,
  maxContentWidth,
  radius,
  spacing,
} from "@/constants/theme";
import type { DictionaryWord } from "@/data/dictionary-words";
import { useTheme } from "@/hooks/use-theme";
import { useProgress } from "@/hooks/use-progress";
import { learnedWords } from "@/lib/today";
import { plural } from "@/utils/format";

/**
 * Matches the word, its reading, or its English meaning.
 * Readings also match romaji two ways: against the reading's romaji, so
 * partial input like "nek" finds ねこ, and via the query converted to
 * hiragana, so other spellings ("si" for し) and katakana input (ネコ) work
 * too. Comparing against the reading in hiragana lets hiragana or romaji
 * input find katakana words as well.
 */
function matches(word: DictionaryWord, query: string, kanaQuery: string) {
  return (
    word.word.includes(query) ||
    word.reading.includes(query) ||
    word.readingHiragana.includes(kanaQuery) ||
    word.romaji.includes(query) ||
    word.meaning.toLowerCase().includes(query)
  );
}

/**
 * Dictionary: the words the user has learned so far, in list order, with a
 * search that filters as you type. Each row opens the word's page.
 */
export default function DictionaryScreen() {
  const { theme } = useTheme();
  const progress = useProgress();
  const [query, setQuery] = useState("");

  const learned = learnedWords(progress);
  const normalizedQuery = query.trim().toLowerCase();
  const kanaQuery = toHiragana(normalizedQuery);
  const results = normalizedQuery
    ? learned.filter((word) => matches(word, normalizedQuery, kanaQuery))
    : learned;

  if (learned.length === 0) {
    return (
      <EmptyState
        icon={BookBookmark}
        title="No words yet"
        description="Words you learn in lessons will appear here."
      />
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Dictionary</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {plural(learned.length, "word", "words")} learned
          </Text>
        </View>

        <View
          style={[
            styles.search,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Search color={theme.textSubtle} size={iconSize.md} />
          <ThemedTextInput
            accessibilityLabel="Search words"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search in Japanese or English"
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
                accessibilityLabel={[
                  item.word,
                  item.reading,
                  item.meaning,
                ].join(", ")}
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
                {/* Two lines in every row (every word has a meaning), so
                    rows are the same height with or without a reading. */}
                <View style={styles.rowText}>
                  <View style={styles.rowJapanese}>
                    <Text
                      lang="ja"
                      style={[styles.expression, { color: theme.text }]}
                    >
                      {item.word}
                    </Text>
                    {/* Kana-only words (あなた) would repeat themselves. */}
                    {item.reading !== item.word ? (
                      <Text
                        lang="ja"
                        style={[styles.reading, { color: theme.textMuted }]}
                      >
                        {item.reading}
                      </Text>
                    ) : null}
                  </View>
                  {/* One line; the full meaning is on the word page. */}
                  <Text
                    numberOfLines={1}
                    style={[styles.meaning, { color: theme.text }]}
                  >
                    {item.meaning}
                  </Text>
                  {/* The word's position in the list, hidden for now.
                  <Text style={[styles.position, { color: theme.textSubtle }]}>
                    #{item.position}
                  </Text> */}
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
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  rowJapanese: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  // Japanese text sets no fontFamily: Figtree has no Japanese glyphs.
  expression: {
    fontSize: fontSize.lg,
  },
  reading: {
    fontSize: fontSize.sm,
  },
  meaning: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
  },
  position: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
  },
  noResults: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
});
