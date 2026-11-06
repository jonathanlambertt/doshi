/**
 * The only module that talks to ts-fsrs. Everything else works with the types
 * and functions exported here, so swapping or upgrading the FSRS library means
 * changing this file alone.
 */
import { DefaultScheduler, Rating } from "ts-fsrs";

import { DESIRED_RETENTION } from "@/constants/lesson";

/**
 * Pinned FSRS settings. Changing the model version changes how stored cards
 * are interpreted, so it must stay explicit rather than follow the library
 * default (ts-fsrs 6 defaults to FSRS-7).
 *
 * - FSRS-6 schedules in whole days, so a failed word comes back tomorrow.
 *   FSRS-7 works in fractional days and, without learning steps, schedules a
 *   failed word seconds later.
 * - No short-term learning steps: a word failed in a lesson's quick check gets
 *   one practice retry in the same session (handled by the app), then FSRS
 *   brings it back the next day.
 */
export const SCHEDULER_SETTINGS = {
  version: "FSRS-6",
  desiredRetention: DESIRED_RETENTION,
  enableShortTerm: false,
  learningSteps: [],
  relearningSteps: [],
} as const;

/** The two grades Doshi offers. FSRS also has Hard and Easy; we don't use them. */
export type Grade = "again" | "good";

const RATINGS = { again: Rating.Again, good: Rating.Good } as const;

/**
 * Creates the scheduler. Async because ts-fsrs loads the model on demand.
 * `fuzz` spreads intervals slightly so words learned together don't all come
 * due on the same day; tests turn it off for exact intervals.
 */
export async function createScheduler({ fuzz = true } = {}) {
  return DefaultScheduler({ ...SCHEDULER_SETTINGS, enableFuzz: fuzz });
}

export type Scheduler = Awaited<ReturnType<typeof createScheduler>>;
export type SrsCard = ReturnType<Scheduler["newCard"]>;

/**
 * Grades a word. Pass `card: null` the first time a word is graded (at the end
 * of its lesson); FSRS starts it from a new card. The card id is the word id,
 * which also makes fuzzing repeatable per word.
 */
export function gradeWord(
  scheduler: Scheduler,
  wordId: string,
  card: SrsCard | null,
  grade: Grade,
  now: Date,
): SrsCard {
  const current = card ?? scheduler.newCard({ now, cardId: wordId });
  return scheduler.review({ card: current, grade: RATINGS[grade], now }).card;
}

/** Cards are stored as JSON; JSON turns their two Date fields into strings. */
export function cardToJson(card: SrsCard): string {
  return JSON.stringify(card);
}

export function cardFromJson(json: string): SrsCard {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    dueAt: new Date(parsed.dueAt),
    lastReviewAt: parsed.lastReviewAt ? new Date(parsed.lastReviewAt) : null,
  };
}
