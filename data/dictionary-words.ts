import { toHiragana, toRomaji } from "wanakana";

import WORDS from "@/data/words.json";

/**
 * One drawn pitch accent pattern.
 * - `pitch`: one H or L per mora, plus one for a particle after the word:
 *   あなた LHLL, わたし LHHH (flat), いぬ LHL (the drop comes after the word).
 * - `nasal`, `devoiced`: 1-based moras said with a nasal g or devoiced.
 */
export type PitchPattern = {
  kana: string;
  pitch: string;
  nasal: number[];
  devoiced: number[];
};

export type PitchAccent = {
  /** Usually one; a few words have more than one accepted pattern. */
  patterns: PitchPattern[];
  notes: string | null;
};

/** A run of an example sentence: kanji with their reading, or plain text. */
export type SentenceSegment = {
  text: string;
  /** Furigana for `text`; absent for kana, punctuation and line breaks. */
  reading?: string;
  /** Part of the word the sentence illustrates. */
  highlight?: boolean;
};

export type ExampleSentence = {
  text: string;
  segments: SentenceSegment[];
  translation: string;
};

/** One entry as written by scripts/extract-kaishi-words.py. */
type WordEntry = {
  id: string;
  position: number;
  word: string;
  reading: string;
  meaning: string;
  notes: string | null;
  pitchAccent: PitchAccent | null;
  sentence: ExampleSentence | null;
};

/** One word in the list, with what search and display derive from it. */
export type DictionaryWord = WordEntry & {
  /** Hepburn romaji of the reading, for display and search. */
  romaji: string;
  /** The reading in hiragana, so katakana readings match hiragana searches. */
  readingHiragana: string;
};

/** The Kaishi 1.5k word list, in learning order (see data/words.json). */
export const DICTIONARY_WORDS: readonly DictionaryWord[] = (
  WORDS as WordEntry[]
).map((entry) => ({
  ...entry,
  romaji: toRomaji(entry.reading),
  readingHiragana: toHiragana(entry.reading),
}));

const WORDS_BY_ID = new Map(DICTIONARY_WORDS.map((word) => [word.id, word]));

/** A word in the list by id, or undefined if it isn't in the list. */
export function getDictionaryWord(id: string | undefined) {
  return id === undefined ? undefined : WORDS_BY_ID.get(id);
}
