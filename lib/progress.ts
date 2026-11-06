/**
 * The user's progress, held in memory and mirrored to SQLite.
 *
 * Everything is loaded once at startup (`initProgress`), so screens read it
 * synchronously. Changes update memory first — the UI never waits on disk —
 * then are written to the database in order through a single queue.
 */
import { randomUUID } from "expo-crypto";

import {
  type Database,
  deleteAllProgress,
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
  /** Dev only: how far the clock has been moved forward, in milliseconds. */
  timeOffsetMs: number;
};

const SETTING_READING_LEVEL = "reading_level";
const SETTING_ROMAJI = "show_romaji";
const SETTING_TIME_OFFSET = "dev_time_offset_ms";
const READING_LEVELS: readonly ReadingLevel[] = ["fluent", "some", "none"];

let db: Database | null = null;
let scheduler: Scheduler | null = null;
let state: ProgressState = {
  cards: new Map(),
  readingLevel: null,
  romaji: null,
  timeOffsetMs: 0,
};
const listeners = new Set<() => void>();
let writeQueue: Promise<void> = Promise.resolve();

/** Opens the database and loads all progress. Call once before rendering. */
export async function initProgress() {
  const [database, loadedScheduler] = await Promise.all([
    openDatabase(),
    createScheduler(),
  ]);
  const [cards, settings] = await Promise.all([
    loadCards(database),
    loadSettings(database),
  ]);
  db = database;
  scheduler = loadedScheduler;

  const readingLevel = settings[SETTING_READING_LEVEL];
  const romaji = settings[SETTING_ROMAJI];
  state = {
    cards: new Map(cards.map((stored) => [stored.wordId, stored])),
    readingLevel: READING_LEVELS.includes(readingLevel as ReadingLevel)
      ? (readingLevel as ReadingLevel)
      : null,
    romaji: romaji === "1" ? true : romaji === "0" ? false : null,
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

/**
 * Grades a word: its first grade (kind "lesson") starts it in FSRS; later
 * grades (kind "review") update it.
 */
export function recordGrade(wordId: string, grade: Grade, kind: ReviewKind) {
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
    saveGrade(database, { stored, logId, kind, grade, reviewedAt }),
  );
  return stored;
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
  update({
    cards: new Map(),
    readingLevel: null,
    romaji: null,
    timeOffsetMs: 0,
  });
  write(deleteAllProgress);
}
