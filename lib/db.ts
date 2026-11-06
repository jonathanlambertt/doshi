/**
 * The local database: every SQL statement in the app lives here.
 *
 * - `cards`: one row per word the user has started — its FSRS state.
 * - `review_log`: one row per grade, append-only. It's the record of truth:
 *   replaying a word's log through FSRS rebuilds its card, which is what will
 *   make syncing between devices conflict-free later. Ids are UUIDs made on the
 *   device so two devices can never collide; times are UTC milliseconds.
 * - `settings`: small key/value preferences.
 */
import * as SQLite from "expo-sqlite";

import {
  cardFromJson,
  cardToJson,
  type Grade,
  SCHEDULER_SETTINGS,
  type SrsCard,
} from "@/lib/srs/scheduler";

const DATABASE_NAME = "doshi.db";

/**
 * Schema versions, applied in order and tracked with SQLite's `user_version`.
 * Never edit a shipped migration — append a new one.
 */
const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE cards (
    word_id TEXT PRIMARY KEY NOT NULL,
    due_at INTEGER NOT NULL,
    introduced_at INTEGER NOT NULL,
    fsrs_card TEXT NOT NULL
  );
  CREATE INDEX cards_due_at ON cards (due_at);

  CREATE TABLE review_log (
    id TEXT PRIMARY KEY NOT NULL,
    word_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('lesson', 'review')),
    grade TEXT NOT NULL CHECK (grade IN ('again', 'good')),
    reviewed_at INTEGER NOT NULL,
    fsrs_version TEXT NOT NULL,
    fsrs_card_after TEXT NOT NULL
  );
  CREATE INDEX review_log_word ON review_log (word_id, reviewed_at);

  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

export type Database = SQLite.SQLiteDatabase;

/** A started word: its FSRS card plus when it was first learned. */
export type StoredCard = {
  wordId: string;
  card: SrsCard;
  introducedAt: Date;
};

export type ReviewKind = "lesson" | "review";

export async function openDatabase(): Promise<Database> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await migrate(db);
  return db;
}

async function migrate(db: Database) {
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;",
  );
  const current = row?.user_version ?? 0;
  for (let version = current; version < MIGRATIONS.length; version += 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      // PRAGMA can't take bound parameters; `version` is a loop integer.
      await db.execAsync(`PRAGMA user_version = ${version + 1};`);
    });
  }
}

export async function loadCards(db: Database): Promise<StoredCard[]> {
  const rows = await db.getAllAsync<{
    word_id: string;
    introduced_at: number;
    fsrs_card: string;
  }>("SELECT word_id, introduced_at, fsrs_card FROM cards;");
  return rows.map((row) => ({
    wordId: row.word_id,
    card: cardFromJson(row.fsrs_card),
    introducedAt: new Date(row.introduced_at),
  }));
}

/** Saves a word's new card and its review-log entry together. */
export async function saveGrade(
  db: Database,
  {
    stored,
    logId,
    kind,
    grade,
    reviewedAt,
  }: {
    stored: StoredCard;
    logId: string;
    kind: ReviewKind;
    grade: Grade;
    reviewedAt: Date;
  },
) {
  const cardJson = cardToJson(stored.card);
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO cards (word_id, due_at, introduced_at, fsrs_card)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (word_id) DO UPDATE SET
         due_at = excluded.due_at,
         fsrs_card = excluded.fsrs_card;`,
      stored.wordId,
      stored.card.dueAt.getTime(),
      stored.introducedAt.getTime(),
      cardJson,
    );
    await db.runAsync(
      `INSERT INTO review_log
         (id, word_id, kind, grade, reviewed_at, fsrs_version, fsrs_card_after)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      logId,
      stored.wordId,
      kind,
      grade,
      reviewedAt.getTime(),
      SCHEDULER_SETTINGS.version,
      cardJson,
    );
  });
}

export async function loadSettings(
  db: Database,
): Promise<Record<string, string>> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM settings;",
  );
  return Object.fromEntries(rows.map(({ key, value }) => [key, value]));
}

/** Sets a setting, or removes it when `value` is null. */
export async function saveSetting(
  db: Database,
  key: string,
  value: string | null,
) {
  if (value === null) {
    await db.runAsync("DELETE FROM settings WHERE key = ?;", key);
  } else {
    await db.runAsync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value;`,
      key,
      value,
    );
  }
}

/** Deletes all progress and settings. Used by the dev "Reset progress" tool. */
export async function deleteAllProgress(db: Database) {
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      "DELETE FROM cards; DELETE FROM review_log; DELETE FROM settings;",
    );
  });
}
