import { isDue, startOfDay, startOfNextDay } from "@/lib/srs/day";

/** What Home and the Dictionary show about the user's progress today. */
export type TodaySummary = {
  /** Words introduced in lessons so far. */
  wordsLearned: number;
  /** Reviews to do today: words due, up to what's left of the daily limit. */
  reviewsDue: number;
  /** Words due today but over the daily review limit; they wait until tomorrow. */
  reviewsHeldBack: number;
  /** Words introduced in lessons today. */
  newWordsToday: number;
  /** New words still allowed today under the daily limit. */
  newWordsLeftToday: number;
  /** Words in the list not introduced yet. */
  wordsRemaining: number;
  /** When the next review comes due, if there are none left to do today. */
  nextReviewAt: Date | null;
};

/** The minimum a summary needs to know about each started word. */
export type CardTiming = {
  dueAt: Date;
  /** When the word was first graded, at the end of its lesson. */
  introducedAt: Date;
  /** When the word was last graded, in a lesson or a review. */
  lastReviewAt: Date | null;
};

export function summarizeToday({
  cards,
  totalWords,
  newWordsPerDay,
  dailyReviewLimit,
  now,
}: {
  cards: Iterable<CardTiming>;
  totalWords: number;
  newWordsPerDay: number;
  /** The most reviews per day; null for no limit. */
  dailyReviewLimit: number | null;
  now: Date;
}): TodaySummary {
  const dayStart = startOfDay(now).getTime();
  let wordsLearned = 0;
  let dueCount = 0;
  let introducedToday = 0;
  let reviewedToday = 0;
  let nextReviewAt: Date | null = null;

  for (const card of cards) {
    wordsLearned += 1;
    if (card.introducedAt.getTime() >= dayStart) {
      introducedToday += 1;
    } else if (card.lastReviewAt && card.lastReviewAt.getTime() >= dayStart) {
      // A review is always at least a day out, so a word is reviewed at most
      // once a day; words graded today in their lesson aren't reviews.
      reviewedToday += 1;
    }
    if (isDue(card.dueAt, now)) {
      dueCount += 1;
    } else if (!nextReviewAt || card.dueAt < nextReviewAt) {
      nextReviewAt = card.dueAt;
    }
  }

  const reviewsLeftToday =
    dailyReviewLimit === null
      ? dueCount
      : Math.max(0, dailyReviewLimit - reviewedToday);
  const reviewsDue = Math.min(dueCount, reviewsLeftToday);
  const reviewsHeldBack = dueCount - reviewsDue;
  const wordsRemaining = Math.max(0, totalWords - wordsLearned);

  return {
    wordsLearned,
    reviewsDue,
    reviewsHeldBack,
    newWordsToday: introducedToday,
    newWordsLeftToday: Math.min(
      wordsRemaining,
      Math.max(0, newWordsPerDay - introducedToday),
    ),
    wordsRemaining,
    // Held-back words are next up as soon as the limit resets.
    nextReviewAt:
      reviewsDue > 0
        ? null
        : reviewsHeldBack > 0
          ? startOfNextDay(now)
          : nextReviewAt,
  };
}
