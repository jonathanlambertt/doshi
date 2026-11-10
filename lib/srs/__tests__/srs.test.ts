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
import { type CardTiming, summarizeToday } from "@/lib/srs/summary";

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

  it("schedules sooner for a higher desired retention, without changing memory", async () => {
    const strict = await createScheduler({ desiredRetention: 0.95, fuzz: false });
    const relaxed = await createScheduler({ desiredRetention: 0.85, fuzz: false });
    const first = gradeWord(scheduler, "w1", null, "good", at(3, 10));
    const reviewed = (s: Scheduler) =>
      gradeWord(s, "w1", first, "good", first.dueAt);

    const interval = (s: Scheduler) => daysBetween(first.dueAt, reviewed(s).dueAt);
    expect(interval(strict)).toBeLessThan(interval(scheduler));
    expect(interval(relaxed)).toBeGreaterThan(interval(scheduler));
    // Stability is what FSRS learned about the word; retention doesn't touch it.
    expect(reviewed(strict).stability).toBeCloseTo(reviewed(scheduler).stability);
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

  /** A started word; last graded in its lesson unless `lastReviewAt` is given. */
  const card = (introducedAt: Date, dueAt: Date, lastReviewAt = introducedAt) => ({
    introducedAt,
    dueAt,
    lastReviewAt,
  });

  const summarize = (
    cards: CardTiming[],
    options: Partial<Parameters<typeof summarizeToday>[0]> = {},
  ) =>
    summarizeToday({
      cards,
      totalWords: 1500,
      newWordsPerDay: 10,
      dailyReviewLimit: null,
      now,
      ...options,
    });

  it("summarizes a brand-new user", () => {
    expect(summarize([])).toEqual({
      wordsLearned: 0,
      reviewsDue: 0,
      reviewsHeldBack: 0,
      newWordsToday: 0,
      newWordsLeftToday: 10,
      wordsRemaining: 1500,
      nextReviewAt: null,
    });
  });

  it("counts due reviews and today's new words", () => {
    const summary = summarize([
      card(at(5, 9), at(10, 9)), // due
      card(at(5, 9), at(10, 20)), // due later today
      card(at(10, 9), at(13, 9)), // learned today
      card(at(10, 2), at(13, 2)), // 2 am: yesterday
    ]);

    expect(summary.wordsLearned).toBe(4);
    expect(summary.reviewsDue).toBe(2);
    expect(summary.newWordsToday).toBe(1);
    expect(summary.newWordsLeftToday).toBe(9);
    expect(summary.nextReviewAt).toBeNull();
  });

  it("reports the next review when nothing is due", () => {
    const summary = summarize([
      card(at(10, 9), at(13, 9)),
      card(at(10, 9), at(11, 9)),
    ]);

    expect(summary.reviewsDue).toBe(0);
    expect(summary.nextReviewAt).toEqual(at(11, 9));
  });

  it("never offers more new words than are left in the list", () => {
    const summary = summarize([card(at(1, 9), at(30, 9))], { totalWords: 4 });

    expect(summary.wordsRemaining).toBe(3);
    expect(summary.newWordsLeftToday).toBe(3);
  });

  it("offers no new words once today's count reaches a lowered limit", () => {
    const learnedToday = Array.from({ length: 10 }, () =>
      card(at(10, 9), at(13, 9)),
    );
    const summary = summarize(learnedToday, { newWordsPerDay: 5 });

    expect(summary.newWordsToday).toBe(10);
    expect(summary.newWordsLeftToday).toBe(0);
  });

  describe("daily review limit", () => {
    const dueWords = (count: number) =>
      Array.from({ length: count }, () => card(at(5, 9), at(10, 9)));
    const reviewedToday = (count: number) =>
      Array.from({ length: count }, () =>
        card(at(5, 9), at(14, 9), at(10, 8)),
      );

    it("holds back due words over the limit until tomorrow", () => {
      const summary = summarize(dueWords(8), { dailyReviewLimit: 5 });

      expect(summary.reviewsDue).toBe(5);
      expect(summary.reviewsHeldBack).toBe(3);
      expect(summary.nextReviewAt).toBeNull();
    });

    it("counts today's reviews against the limit", () => {
      const summary = summarize([...reviewedToday(3), ...dueWords(4)], {
        dailyReviewLimit: 5,
      });

      expect(summary.reviewsDue).toBe(2);
      expect(summary.reviewsHeldBack).toBe(2);
    });

    it("doesn't count words learned in today's lessons as reviews", () => {
      const learnedToday = Array.from({ length: 10 }, () =>
        card(at(10, 9), at(13, 9)),
      );
      const summary = summarize([...learnedToday, ...dueWords(4)], {
        dailyReviewLimit: 5,
      });

      expect(summary.reviewsDue).toBe(4);
      expect(summary.reviewsHeldBack).toBe(0);
    });

    it("points to tomorrow's rollover once the limit is reached", () => {
      const summary = summarize(
        [...reviewedToday(5), ...dueWords(2), card(at(5, 9), at(12, 9))],
        { dailyReviewLimit: 5 },
      );

      expect(summary.reviewsDue).toBe(0);
      expect(summary.reviewsHeldBack).toBe(2);
      expect(summary.nextReviewAt).toEqual(at(11, 4));
    });

    it("has no limit when set to null", () => {
      const summary = summarize([...reviewedToday(300), ...dueWords(300)]);

      expect(summary.reviewsDue).toBe(300);
      expect(summary.reviewsHeldBack).toBe(0);
    });
  });
});
