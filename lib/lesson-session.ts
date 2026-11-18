import { LESSON_WORD_COUNT } from "@/constants/lesson";
import type { DictionaryWord } from "@/data/dictionary-words";
import { getProgress } from "@/lib/progress";
import { computeToday, nextNewWords } from "@/lib/today";

/**
 * The words in the lesson currently open. Chosen when the lesson starts and
 * fixed until it ends, so grading a word mid-lesson doesn't shift the list.
 * Held in memory only: an interrupted lesson simply starts fresh next time,
 * with any words already graded counted as learned.
 */
let lessonWords: readonly DictionaryWord[] = [];

/**
 * Whether the open lesson is the user's first: no words were learned when it
 * started. Fixed for the same reason as the words — the quick check's grades
 * mustn't change it partway through.
 */
let firstLesson = false;

/** How many words the next lesson would teach right now (0 if none allowed). */
export function nextLessonSize() {
  return Math.min(LESSON_WORD_COUNT, computeToday(getProgress()).newWordsLeftToday);
}

export function startLesson(): readonly DictionaryWord[] {
  const progress = getProgress();
  firstLesson = computeToday(progress).wordsLearned === 0;
  lessonWords = nextNewWords(progress, nextLessonSize());
  return lessonWords;
}

export function getLessonWords(): readonly DictionaryWord[] {
  return lessonWords;
}

/**
 * True during the user's first lesson, which shows how to read a card and
 * explains the quick check in full.
 */
export function isFirstLesson(): boolean {
  return firstLesson;
}
