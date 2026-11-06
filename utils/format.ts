/**
 * "1500" → "1,500". Done by hand rather than toLocaleString so it doesn't
 * depend on the device's locale; switch to Intl.NumberFormat if the app is
 * ever translated.
 */
export function formatCount(count: number) {
  return String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "1 word", "1,500 words". */
export function plural(count: number, one: string, many: string) {
  return `${formatCount(count)} ${count === 1 ? one : many}`;
}

/** "in about 3 hours", "in about 1 day" — deliberately rough. */
export function formatTimeUntil(date: Date, now: Date) {
  const minutes = Math.max(0, (date.getTime() - now.getTime()) / 60000);
  if (minutes < 60) return "in under an hour";
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in about ${plural(hours, "hour", "hours")}`;
  return `in about ${plural(Math.round(hours / 24), "day", "days")}`;
}
