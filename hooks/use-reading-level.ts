import { useProgress } from "@/hooks/use-progress";
import { getProgress, showsRomaji } from "@/lib/progress";

export {
  defaultRomaji,
  setReadingLevel,
  setRomaji,
  type ReadingLevel,
} from "@/lib/progress";

/** The user's answer to the kana question, or null if not asked yet. */
export function getReadingLevel() {
  return getProgress().readingLevel;
}

export function useReadingLevel() {
  return useProgress().readingLevel;
}

/** Whether cards show romaji: the user's own choice, else their reading level. */
export function useShowsRomaji() {
  return showsRomaji(useProgress());
}
