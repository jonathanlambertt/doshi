/**
 * Whether text looks enough like an email address to send a sign-in code to:
 * something@domain.tld, with no spaces. Only a quick check before sending —
 * whether the code arrives is the real test.
 */
export function isPlausibleEmail(text: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}
