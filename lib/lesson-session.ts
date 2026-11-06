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

/** How many words the next lesson would teach right now (0 if none allowed). */
export function nextLessonSize() {
  return Math.min(LESSON_WORD_COUNT, computeToday(getProgress()).newWordsLeftToday);
}

export function startLesson(): readonly DictionaryWord[] {
  lessonWords = nextNewWords(getProgress(), nextLessonSize());
  return lessonWords;
}

export function getLessonWords(): readonly DictionaryWord[] {
  return lessonWords;
}
