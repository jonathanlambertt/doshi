import { toHiragana, toRomaji } from "wanakana";

import { SAMPLE_WORDS } from "@/data/sample-words";

/** One row in the Dictionary, from whichever word list is loaded. */
export type DictionaryWord = {
  id: string;
  /** 1-based position in the list's learning order. */
  position: number;
  word: string;
  reading: string;
  /** Hepburn romaji of the reading, for display and search. */
  romaji: string;
  /** The reading in hiragana, so katakana readings match hiragana searches. */
  readingHiragana: string;
  /**
   * Sample words have hand-written meanings; Kaishi words get theirs from
   * JMdict when `kaishi-meanings.json` is present (see
   * scripts/match-jmdict-meanings.py), and have none otherwise.
   */
  meaning?: string;
  partOfSpeech?: string;
};

/** The shape written by scripts/extract-kaishi-words.py. */
type KaishiEntry = {
  position: number;
  guid: string;
  word: string;
  reading: string;
};

/** The shape written by scripts/match-jmdict-meanings.py. */
type KaishiMeaning = {
  guid: string;
  meaning: string;
  partOfSpeech: string | null;
  jmdictId: string;
};

type KaishiFiles = {
  words: KaishiEntry[];
  meanings: Map<string, KaishiMeaning>;
};

/**
 * The locally extracted Kaishi word list with its JMdict meanings, or null if
 * the word list isn't available. Meanings are optional.
 *
 * Kaishi has no license, so these files are gitignored and dev-only (see the
 * licensing notes in README.md). Two guards keep it out of other builds:
 * - `__DEV__`: release builds fold this branch away before Metro collects
 *   dependencies, so the files are never bundled.
 * - `require.context` instead of `require`: when the files are absent (a fresh
 *   clone, or an EAS build, which skips gitignored files) the context is empty
 *   and the app falls back to the sample words instead of failing to bundle.
 */
function loadKaishi(): KaishiFiles | null {
  if (__DEV__) {
    const context = require.context(
      "./",
      true,
      /source\/kaishi-(words|meanings)\.json$/,
    );
    const keys = context.keys();
    const wordsKey = keys.find((key) => key.endsWith("kaishi-words.json"));
    const meaningsKey = keys.find((key) =>
      key.endsWith("kaishi-meanings.json"),
    );
    if (wordsKey) {
      const meanings: KaishiMeaning[] = meaningsKey ? context(meaningsKey) : [];
      return {
        words: context(wordsKey) as KaishiEntry[],
        meanings: new Map(meanings.map((meaning) => [meaning.guid, meaning])),
      };
    }
  }
  return null;
}

const kaishi = loadKaishi();

export const DICTIONARY_WORDS: readonly DictionaryWord[] = kaishi
  ? kaishi.words.map(({ guid, position, word, reading }) => ({
      id: guid,
      position,
      word,
      reading,
      romaji: toRomaji(reading),
      readingHiragana: toHiragana(reading),
      meaning: kaishi.meanings.get(guid)?.meaning,
      partOfSpeech: kaishi.meanings.get(guid)?.partOfSpeech ?? undefined,
    }))
  : SAMPLE_WORDS.map((sample, index) => ({
      id: sample.id,
      position: index + 1,
      word: sample.expression,
      reading: sample.reading,
      romaji: toRomaji(sample.reading),
      readingHiragana: toHiragana(sample.reading),
      meaning: sample.meaning,
      partOfSpeech: sample.partOfSpeech,
    }));

const WORDS_BY_ID = new Map(DICTIONARY_WORDS.map((word) => [word.id, word]));

/** A word in the loaded list by id, or undefined if it isn't in the list. */
export function getDictionaryWord(id: string | undefined) {
  return id === undefined ? undefined : WORDS_BY_ID.get(id);
}
