/** Number of new words introduced in a lesson. Shown on Home and the lesson intro. */
export const LESSON_WORD_COUNT = 5;

/** Rough length of a lesson, in minutes — an estimate shown to the user, not a timer. */
export const LESSON_ESTIMATED_MINUTES = 3;

/** Rough time per review, in seconds — used only for "about N min" estimates. */
export const REVIEW_ESTIMATED_SECONDS = 10;

/*
 * Scheduling settings: the choices offered in Settings and their defaults.
 * Defaults are tuned for beginners, so nobody has to touch them.
 */

/**
 * New words a user can learn per day. Whole lessons only. Raising it raises
 * review load for weeks.
 */
export const NEW_WORDS_PER_DAY_OPTIONS = [5, 10, 15, 20] as const;
export const NEW_WORDS_PER_DAY = 10;

/**
 * The most reviews asked of a user per day; `null` is no limit. Keeps busy
 * days short; reviews over the limit wait until the next day.
 */
export const DAILY_REVIEW_LIMIT_OPTIONS = [50, 100, 200, null] as const;
export const DAILY_REVIEW_LIMIT = 100;

/**
 * FSRS target: the chance of remembering a word when it comes up for review.
 * Higher means shorter intervals and more reviews.
 */
export const DESIRED_RETENTION_OPTIONS = [0.85, 0.9, 0.95] as const;
export const DESIRED_RETENTION = 0.9;
