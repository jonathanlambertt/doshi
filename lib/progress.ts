/**
 * The user's progress, held in memory and mirrored to SQLite.
 *
 * Everything is loaded once at startup (`initProgress`), so screens read it
 * synchronously. Changes update memory first — the UI never waits on disk —
 * then are written to the database in order through a single queue.
 */
import { randomUUID } from "expo-crypto";

import {
  DAILY_REVIEW_LIMIT,
  DAILY_REVIEW_LIMIT_OPTIONS,
  DESIRED_RETENTION,
  DESIRED_RETENTION_OPTIONS,
  NEW_WORDS_PER_DAY,
  NEW_WORDS_PER_DAY_OPTIONS,
} from "@/constants/lesson";
import {
  type Database,
  deleteAllProgress,
  deleteGrade,
  loadCards,
  loadSettings,
  openDatabase,
  type ReviewKind,
  saveGrade,
  saveSetting,
  type StoredCard,
} from "@/lib/db";
import {
  createScheduler,
  type Grade,
  gradeWord,
  type Scheduler,
} from "@/lib/srs/scheduler";

/**
 * How well the user reads kana, answered once in the first lesson:
 * "fluent" = yes, "some" = a little, "none" = not yet.
 */
export type ReadingLevel = "fluent" | "some" | "none";

export type NewWordsPerDay = (typeof NEW_WORDS_PER_DAY_OPTIONS)[number];
/** The most reviews per day; null for no limit. */
export type DailyReviewLimit = (typeof DAILY_REVIEW_LIMIT_OPTIONS)[number];
export type DesiredRetention = (typeof DESIRED_RETENTION_OPTIONS)[number];

export type ProgressState = {
  /** Started words, keyed by word id. */
  cards: ReadonlyMap<string, StoredCard>;
  /** Null until the user has answered the kana question. */
  readingLevel: ReadingLevel | null;
  /**
   * Whether to show romaji, if the user chose explicitly. Null follows the
   * reading level (see `showsRomaji`).
   */
  romaji: boolean | null;
  newWordsPerDay: NewWordsPerDay;
  dailyReviewLimit: DailyReviewLimit;
  /** FSRS target recall, applied from each word's next grade. */
  desiredRetention: DesiredRetention;
  /** Dev only: how far the clock has been moved forward, in milliseconds. */
  timeOffsetMs: number;
};

const SETTING_READING_LEVEL = "reading_level";
const SETTING_ROMAJI = "show_romaji";
const SETTING_NEW_WORDS_PER_DAY = "new_words_per_day";
const SETTING_DAILY_REVIEW_LIMIT = "daily_review_limit";
const SETTING_DESIRED_RETENTION = "desired_retention";
const SETTING_TIME_OFFSET = "dev_time_offset_ms";
const READING_LEVELS: readonly ReadingLevel[] = ["fluent", "some", "none"];
/** How "no daily review limit" is stored. */
const NO_LIMIT = "none";

const INITIAL_STATE: ProgressState = {
  cards: new Map(),
  readingLevel: null,
  romaji: null,
  newWordsPerDay: NEW_WORDS_PER_DAY,
  dailyReviewLimit: DAILY_REVIEW_LIMIT,
  desiredRetention: DESIRED_RETENTION,
  timeOffsetMs: 0,
};

let db: Database | null = null;
/**
 * One scheduler per desired-retention choice, all created at startup, so a
 * change in Settings applies to the very next grade without waiting on ts-fsrs.
 */
let schedulers: ReadonlyMap<DesiredRetention, Scheduler> = new Map();
let state: ProgressState = INITIAL_STATE;
const listeners = new Set<() => void>();
let writeQueue: Promise<void> = Promise.resolve();

/** A stored setting if it's one of the choices offered, else the default. */
function parseChoice<T extends number | null>(
  stored: string | undefined,
  choices: readonly T[],
  fallback: T,
): T {
  if (stored === undefined) return fallback;
  const value = stored === NO_LIMIT ? null : Number(stored);
  return choices.includes(value as T) ? (value as T) : fallback;
}

/** Opens the database and loads all progress. Call once before rendering. */
export async function initProgress() {
  const [database, loadedSchedulers] = await Promise.all([
    openDatabase(),
    Promise.all(
      DESIRED_RETENTION_OPTIONS.map((desiredRetention) =>
        createScheduler({ desiredRetention }),
      ),
    ),
  ]);
  const [cards, settings] = await Promise.all([
    loadCards(database),
    loadSettings(database),
  ]);
  db = database;
  schedulers = new Map(
    DESIRED_RETENTION_OPTIONS.map((retention, index) => [
      retention,
      loadedSchedulers[index],
    ]),
  );

  const readingLevel = settings[SETTING_READING_LEVEL];
  const romaji = settings[SETTING_ROMAJI];
  state = {
    cards: new Map(cards.map((stored) => [stored.wordId, stored])),
    readingLevel: READING_LEVELS.includes(readingLevel as ReadingLevel)
      ? (readingLevel as ReadingLevel)
      : null,
    romaji: romaji === "1" ? true : romaji === "0" ? false : null,
    newWordsPerDay: parseChoice(
      settings[SETTING_NEW_WORDS_PER_DAY],
      NEW_WORDS_PER_DAY_OPTIONS,
      NEW_WORDS_PER_DAY,
    ),
    dailyReviewLimit: parseChoice(
      settings[SETTING_DAILY_REVIEW_LIMIT],
      DAILY_REVIEW_LIMIT_OPTIONS,
      DAILY_REVIEW_LIMIT,
    ),
    desiredRetention: parseChoice(
      settings[SETTING_DESIRED_RETENTION],
      DESIRED_RETENTION_OPTIONS,
      DESIRED_RETENTION,
    ),
    timeOffsetMs: __DEV__ ? Number(settings[SETTING_TIME_OFFSET] ?? 0) : 0,
  };
}

export function getProgress(): ProgressState {
  return state;
}

export function subscribeToProgress(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The current time — moved forward by the dev time-travel tool, if used. */
export function now(): Date {
  return new Date(Date.now() + state.timeOffsetMs);
}

function update(next: Partial<ProgressState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function write(task: (database: Database) => Promise<void>) {
  const database = db;
  if (!database) throw new Error("Progress used before initProgress()");
  writeQueue = writeQueue
    .then(() => task(database))
    .catch((error) => console.error("Saving progress failed", error));
}

/** A grade as recorded: what `undoGrade` needs to take it back. */
export type GradeRecord = {
  wordId: string;
  logId: string;
  /** The word's card before this grade; null if this grade started it. */
  previous: StoredCard | null;
};

/**
 * Grades a word: its first grade (kind "lesson") starts it in FSRS; later
 * grades (kind "review") update it.
 */
export function recordGrade(
  wordId: string,
  grade: Grade,
  kind: ReviewKind,
): GradeRecord {
  const { desiredRetention } = state;
  const scheduler = schedulers.get(desiredRetention);
  if (!scheduler) throw new Error("Progress used before initProgress()");
  const reviewedAt = now();
  const existing = state.cards.get(wordId);
  const stored: StoredCard = {
    wordId,
    card: gradeWord(scheduler, wordId, existing?.card ?? null, grade, reviewedAt),
    introducedAt: existing?.introducedAt ?? reviewedAt,
  };

  const cards = new Map(state.cards);
  cards.set(wordId, stored);
  update({ cards });

  const logId = randomUUID();
  write((database) =>
    saveGrade(database, {
      stored,
      logId,
      kind,
      grade,
      reviewedAt,
      desiredRetention,
    }),
  );
  return { wordId, logId, previous: existing ?? null };
}

/**
 * Takes back a grade, e.g. a mis-tap: the word's card returns to how it was
 * and the grade leaves the review log. Only the word's latest grade can be
 * undone, so undo in the reverse order grades were made.
 */
export function undoGrade(record: GradeRecord) {
  const cards = new Map(state.cards);
  if (record.previous) {
    cards.set(record.wordId, record.previous);
  } else {
    cards.delete(record.wordId);
  }
  update({ cards });
  write((database) => deleteGrade(database, record));
}

export function setReadingLevel(level: ReadingLevel) {
  update({ readingLevel: level });
  write((database) => saveSetting(database, SETTING_READING_LEVEL, level));
}

/** The user's explicit romaji choice; overrides the reading-level default. */
export function setRomaji(show: boolean) {
  update({ romaji: show });
  write((database) => saveSetting(database, SETTING_ROMAJI, show ? "1" : "0"));
}

export function setNewWordsPerDay(count: NewWordsPerDay) {
  update({ newWordsPerDay: count });
  write((database) =>
    saveSetting(database, SETTING_NEW_WORDS_PER_DAY, String(count)),
  );
}

export function setDailyReviewLimit(limit: DailyReviewLimit) {
  update({ dailyReviewLimit: limit });
  write((database) =>
    saveSetting(
      database,
      SETTING_DAILY_REVIEW_LIMIT,
      limit === null ? NO_LIMIT : String(limit),
    ),
  );
}

/**
 * Words already scheduled keep their due dates; the new target applies from
 * each word's next grade.
 */
export function setDesiredRetention(retention: DesiredRetention) {
  update({ desiredRetention: retention });
  write((database) =>
    saveSetting(database, SETTING_DESIRED_RETENTION, String(retention)),
  );
}

/**
 * Romaji is shown if the user turned it on, or — when they haven't chosen —
 * to anyone who doesn't comfortably read kana.
 */
export function showsRomaji(
  progress: Pick<ProgressState, "readingLevel" | "romaji">,
) {
  return progress.romaji ?? defaultRomaji(progress.readingLevel);
}

export function defaultRomaji(level: ReadingLevel | null) {
  return level !== "fluent";
}

/** Dev only: moves the app's clock forward, so reviews come due without waiting. */
export function advanceTime(ms: number) {
  if (!__DEV__) return;
  const timeOffsetMs = state.timeOffsetMs + ms;
  update({ timeOffsetMs });
  write((database) =>
    saveSetting(database, SETTING_TIME_OFFSET, String(timeOffsetMs)),
  );
}

/** Dev only: deletes all progress and settings, and resets the clock. */
export function resetProgress() {
  if (!__DEV__) return;
  update(INITIAL_STATE);
  write(deleteAllProgress);
}
