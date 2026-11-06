/** Number of new words introduced in a lesson. Shown on Home and the lesson intro. */
export const LESSON_WORD_COUNT = 5;

/** Rough length of a lesson, in minutes — an estimate shown to the user, not a timer. */
export const LESSON_ESTIMATED_MINUTES = 3;

/** New words a user can learn per day — two lessons. Raising it raises review load for weeks. */
export const NEW_WORDS_PER_DAY = 10;

/** Rough time per review, in seconds — used only for "about N min" estimates. */
export const REVIEW_ESTIMATED_SECONDS = 10;

/** FSRS target: the chance of remembering a word when it comes up for review. */
export const DESIRED_RETENTION = 0.9;
