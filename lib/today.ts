import { DICTIONARY_WORDS, type DictionaryWord } from "@/data/dictionary-words";
import type { StoredCard } from "@/lib/db";
import { now, type ProgressState } from "@/lib/progress";
import { isDue } from "@/lib/srs/day";
import { summarizeToday, type TodaySummary } from "@/lib/srs/summary";

export type { TodaySummary } from "@/lib/srs/summary";

const WORDS_BY_ID = new Map(DICTIONARY_WORDS.map((word) => [word.id, word]));

/**
 * Cards for words in the current list. Cards for other words are ignored —
 * e.g. progress made against the sample words while the Kaishi list is loaded.
 */
function cardsInList(progress: ProgressState): StoredCard[] {
  return [...progress.cards.values()].filter((stored) =>
    WORDS_BY_ID.has(stored.wordId),
  );
}

export function computeToday(progress: ProgressState): TodaySummary {
  return summarizeToday({
    cards: cardsInList(progress).map((stored) => ({
      dueAt: stored.card.dueAt,
      introducedAt: stored.introducedAt,
      lastReviewAt: stored.card.lastReviewAt,
    })),
    totalWords: DICTIONARY_WORDS.length,
    newWordsPerDay: progress.newWordsPerDay,
    dailyReviewLimit: progress.dailyReviewLimit,
    now: now(),
  });
}

/** Words learned so far, in list order. */
export function learnedWords(progress: ProgressState): DictionaryWord[] {
  return DICTIONARY_WORDS.filter((word) => progress.cards.has(word.id));
}

/** The next words a lesson would teach: the first unlearned words in list order. */
export function nextNewWords(
  progress: ProgressState,
  count: number,
): DictionaryWord[] {
  return DICTIONARY_WORDS.filter((word) => !progress.cards.has(word.id)).slice(
    0,
    count,
  );
}

/**
 * Words to review today, most overdue first, up to what's left of the daily
 * review limit. Words over the limit wait until tomorrow.
 */
export function dueWords(progress: ProgressState): DictionaryWord[] {
  const current = now();
  return cardsInList(progress)
    .filter((stored) => isDue(stored.card.dueAt, current))
    .sort((a, b) => a.card.dueAt.getTime() - b.card.dueAt.getTime())
    .slice(0, computeToday(progress).reviewsDue)
    .map((stored) => WORDS_BY_ID.get(stored.wordId) as DictionaryWord);
}
