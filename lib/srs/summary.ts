import { isDue, startOfDay } from "@/lib/srs/day";

/** What Home and the Dictionary show about the user's progress today. */
export type TodaySummary = {
  /** Words introduced in lessons so far. */
  wordsLearned: number;
  /** Reviews due today. */
  reviewsDue: number;
  /** New words still allowed today under the daily limit. */
  newWordsLeftToday: number;
  /** Words in the list not introduced yet. */
  wordsRemaining: number;
  /** When the next review comes due, if nothing is due today. */
  nextReviewAt: Date | null;
};

/** The minimum a summary needs to know about each started word. */
export type CardTiming = {
  dueAt: Date;
  /** When the word was first graded, at the end of its lesson. */
  introducedAt: Date;
};

export function summarizeToday({
  cards,
  totalWords,
  newWordsPerDay,
  now,
}: {
  cards: Iterable<CardTiming>;
  totalWords: number;
  newWordsPerDay: number;
  now: Date;
}): TodaySummary {
  const dayStart = startOfDay(now).getTime();
  let wordsLearned = 0;
  let reviewsDue = 0;
  let introducedToday = 0;
  let nextReviewAt: Date | null = null;

  for (const card of cards) {
    wordsLearned += 1;
    if (card.introducedAt.getTime() >= dayStart) introducedToday += 1;
    if (isDue(card.dueAt, now)) {
      reviewsDue += 1;
    } else if (!nextReviewAt || card.dueAt < nextReviewAt) {
      nextReviewAt = card.dueAt;
    }
  }

  const wordsRemaining = Math.max(0, totalWords - wordsLearned);
  return {
    wordsLearned,
    reviewsDue,
    newWordsLeftToday: Math.min(
      wordsRemaining,
      Math.max(0, newWordsPerDay - introducedToday),
    ),
    wordsRemaining,
    nextReviewAt: reviewsDue > 0 ? null : nextReviewAt,
  };
}
