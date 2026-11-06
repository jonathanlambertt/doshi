import { useProgress } from "@/hooks/use-progress";
import { computeToday, type TodaySummary } from "@/lib/today";

export type { TodaySummary } from "@/lib/today";

/** Today's progress summary; re-computed whenever progress changes. */
export function useToday(): TodaySummary {
  return computeToday(useProgress());
}

/** True once every word in the list has been introduced. */
export function hasLearnedEverything(today: TodaySummary) {
  return today.wordsRemaining === 0;
}
