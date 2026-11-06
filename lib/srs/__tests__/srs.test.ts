// TypeScript 6 no longer loads @types packages automatically; this scopes
// Jest's globals (describe, it, expect) to this file instead of all app code.
/// <reference types="jest" />

import { isDue, startOfDay, startOfNextDay } from "@/lib/srs/day";
import {
  cardFromJson,
  cardToJson,
  createScheduler,
  gradeWord,
  type Scheduler,
} from "@/lib/srs/scheduler";
import { summarizeToday } from "@/lib/srs/summary";

// Dates are local time, matching how the app decides what "today" is.
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute);
const DAY_MS = 24 * 60 * 60 * 1000;
const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / DAY_MS);

describe("scheduler", () => {
  let scheduler: Scheduler;

  beforeAll(async () => {
    // No fuzz, so intervals are exact.
    scheduler = await createScheduler({ fuzz: false });
  });

  it("schedules a first Good a few days out and a first Again for tomorrow", () => {
    const now = at(3, 10);
    const good = gradeWord(scheduler, "w1", null, "good", now);
    const again = gradeWord(scheduler, "w1", null, "again", now);

    expect(daysBetween(now, good.dueAt)).toBe(3);
    expect(daysBetween(now, again.dueAt)).toBe(1);
  });

  it("grows the interval with each successful review", () => {
    const first = gradeWord(scheduler, "w1", null, "good", at(3, 10));
    const second = gradeWord(scheduler, "w1", first, "good", first.dueAt);
    const third = gradeWord(scheduler, "w1", second, "good", second.dueAt);

    const firstInterval = daysBetween(at(3, 10), first.dueAt);
    const secondInterval = daysBetween(first.dueAt, second.dueAt);
    const thirdInterval = daysBetween(second.dueAt, third.dueAt);
    expect(secondInterval).toBeGreaterThan(firstInterval);
    expect(thirdInterval).toBeGreaterThan(secondInterval);
  });

  it("brings a forgotten word back much sooner than its last interval", () => {
    const first = gradeWord(scheduler, "w1", null, "good", at(3, 10));
    const second = gradeWord(scheduler, "w1", first, "good", first.dueAt);
    const lapse = gradeWord(scheduler, "w1", second, "again", second.dueAt);

    expect(daysBetween(second.dueAt, lapse.dueAt)).toBeLessThan(
      daysBetween(first.dueAt, second.dueAt),
    );
    expect(lapse.lapses).toBe(1);
  });

  it("rewards remembering a word late with a bigger stability boost", () => {
    const first = gradeWord(scheduler, "w1", null, "good", at(3, 10));
    const onTime = gradeWord(scheduler, "w1", first, "good", first.dueAt);
    const late = gradeWord(
      scheduler,
      "w1",
      first,
      "good",
      new Date(first.dueAt.getTime() + 10 * DAY_MS),
    );

    expect(late.stability).toBeGreaterThan(onTime.stability);
  });

  it("uses the word id as the card id", () => {
    const card = gradeWord(scheduler, "word-42", null, "good", at(3, 10));
    expect(card.cardId).toBe("word-42");
  });

  it("round-trips a card through JSON storage", () => {
    const card = gradeWord(scheduler, "w1", null, "good", at(3, 10));
    const restored = cardFromJson(cardToJson(card));

    expect(restored).toEqual(card);
    // A restored card must still be gradable (ts-fsrs rejects string dates).
    expect(() =>
      gradeWord(scheduler, "w1", restored, "good", restored.dueAt),
    ).not.toThrow();
  });
});

describe("day boundary (4 am rollover)", () => {
  it("counts 1 am as part of the previous day", () => {
    expect(startOfDay(at(4, 1))).toEqual(at(3, 4));
    expect(startOfNextDay(at(4, 1))).toEqual(at(4, 4));
  });

  it("counts 10 am as part of the same day", () => {
    expect(startOfDay(at(4, 10))).toEqual(at(4, 4));
    expect(startOfNextDay(at(4, 10))).toEqual(at(5, 4));
  });

  it("treats a card due later today as due now", () => {
    expect(isDue(at(4, 22), at(4, 8))).toBe(true);
  });

  it("doesn't treat a card due tomorrow as due tonight", () => {
    expect(isDue(at(5, 10), at(4, 23))).toBe(false);
  });

  it("makes tomorrow-morning cards due once the day rolls over at 4 am", () => {
    expect(isDue(at(5, 10), at(5, 3))).toBe(false);
    expect(isDue(at(5, 10), at(5, 4))).toBe(true);
  });
});

describe("summarizeToday", () => {
  const now = at(10, 12);

  it("summarizes a brand-new user", () => {
    expect(
      summarizeToday({ cards: [], totalWords: 1500, newWordsPerDay: 10, now }),
    ).toEqual({
      wordsLearned: 0,
      reviewsDue: 0,
      newWordsLeftToday: 10,
      wordsRemaining: 1500,
      nextReviewAt: null,
    });
  });

  it("counts due reviews and today's new words", () => {
    const summary = summarizeToday({
      cards: [
        { introducedAt: at(5, 9), dueAt: at(10, 9) }, // due
        { introducedAt: at(5, 9), dueAt: at(10, 20) }, // due later today
        { introducedAt: at(10, 9), dueAt: at(13, 9) }, // learned today
        { introducedAt: at(10, 2), dueAt: at(13, 2) }, // 2 am: yesterday
      ],
      totalWords: 1500,
      newWordsPerDay: 10,
      now,
    });

    expect(summary.wordsLearned).toBe(4);
    expect(summary.reviewsDue).toBe(2);
    expect(summary.newWordsLeftToday).toBe(9);
    expect(summary.nextReviewAt).toBeNull();
  });

  it("reports the next review when nothing is due", () => {
    const summary = summarizeToday({
      cards: [
        { introducedAt: at(10, 9), dueAt: at(13, 9) },
        { introducedAt: at(10, 9), dueAt: at(11, 9) },
      ],
      totalWords: 1500,
      newWordsPerDay: 10,
      now,
    });

    expect(summary.reviewsDue).toBe(0);
    expect(summary.nextReviewAt).toEqual(at(11, 9));
  });

  it("never offers more new words than are left in the list", () => {
    const summary = summarizeToday({
      cards: [{ introducedAt: at(1, 9), dueAt: at(30, 9) }],
      totalWords: 4,
      newWordsPerDay: 10,
      now,
    });

    expect(summary.wordsRemaining).toBe(3);
    expect(summary.newWordsLeftToday).toBe(3);
  });
});
