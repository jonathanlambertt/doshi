/**
 * Doshi's "day" starts at 4 am local time, like Anki: a late-night session at
 * 1 am still counts as the previous day, so it doesn't eat into tomorrow's new
 * words or make tomorrow's reviews due early.
 */
export const DAY_ROLLOVER_HOUR = 4;

/** The start of the Doshi day that contains `now`. */
export function startOfDay(now: Date): Date {
  const start = new Date(now);
  if (start.getHours() < DAY_ROLLOVER_HOUR) {
    start.setDate(start.getDate() - 1);
  }
  start.setHours(DAY_ROLLOVER_HOUR, 0, 0, 0);
  return start;
}

/** The start of the next Doshi day. Uses calendar days, so DST changes are safe. */
export function startOfNextDay(now: Date): Date {
  const next = startOfDay(now);
  next.setDate(next.getDate() + 1);
  next.setHours(DAY_ROLLOVER_HOUR, 0, 0, 0);
  return next;
}

/**
 * Whether a card is due today. A card scheduled for 10 am counts as due from
 * the start of that day, so a user reviewing at 8 am isn't told to wait.
 */
export function isDue(dueAt: Date, now: Date): boolean {
  return dueAt.getTime() < startOfNextDay(now).getTime();
}
