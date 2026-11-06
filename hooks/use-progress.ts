import { useSyncExternalStore } from "react";

import { getProgress, subscribeToProgress } from "@/lib/progress";

/** The user's progress; re-renders whenever it changes. */
export function useProgress() {
  return useSyncExternalStore(subscribeToProgress, getProgress);
}
