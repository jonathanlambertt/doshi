import { router } from "expo-router";
import { BookBookmark, ChevronRight, Search, X } from "lucide-react-native";
import { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toHiragana } from "wanakana";

import { EmptyState } from "@/components/empty-state";
import {
  fontFamily,
  fontSize,
  iconSize,
  maxContentWidth,
  radius,
  spacing,
} from "@/constants/theme";
import {
  DICTIONARY_WORDS,
  type DictionaryWord,
} from "@/data/dictionary-words";
import { useTheme } from "@/hooks/use-theme";
import { useProgress } from "@/hooks/use-progress";
import { learnedWords } from "@/lib/today";
import { plural } from "@/utils/format";


// Without the JMdict meanings file, Kaishi words have no English to search.
const HAS_MEANINGS = DICTIONARY_WORDS.some((word) => word.meaning);
const SEARCH_PLACEHOLDER = HAS_MEANINGS
  ? "Search in Japanese or English"
  : "Search in Japanese or romaji";

/**
 * Matches the word, its reading, or its English meaning when it has one.
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
    (word.meaning?.toLowerCase().includes(query) ?? false)
  );
}

/**
 * Dictionary: the words the user has learned so far, in list order, with a
 * search that filters as you type. In development the list is
 * the locally extracted Kaishi words (with JMdict meanings when present);
 * otherwise the sample words, whose rows open the word detail screen.
 */
export default function DictionaryScreen() {
  const { scheme, theme } = useTheme();
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
          <TextInput
            accessibilityLabel="Search words"
            autoCapitalize="none"
            autoCorrect={false}
            // Match the app's light/dark mode: the iOS keyboard and the
            // cursor otherwise keep the system defaults. iOS tints the cursor
            // with selectionColor; Android uses cursorColor and would paint
            // selectionColor solid over selected text, so it's iOS-only.
            keyboardAppearance={scheme}
            cursorColor={theme.text}
            selectionColor={Platform.OS === "ios" ? theme.text : undefined}
            onChangeText={setQuery}
            placeholder={SEARCH_PLACEHOLDER}
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
                accessibilityLabel={[
                  item.word,
                  item.reading,
                  item.meaning ?? item.romaji,
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
                <View style={styles.rowEnglish}>
                  <Text style={[styles.meaning, { color: theme.text }]}>
                    {item.meaning ?? item.romaji}
                  </Text>
                  <Text
                    style={[styles.partOfSpeech, { color: theme.textSubtle }]}
                  >
                    {item.partOfSpeech ?? `#${item.position}`}
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
