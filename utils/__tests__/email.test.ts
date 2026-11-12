// TypeScript 6 no longer loads @types packages automatically; this scopes
// Jest's globals (describe, it, expect) to this file instead of all app code.
/// <reference types="jest" />

import { isPlausibleEmail } from "@/utils/email";

describe("isPlausibleEmail", () => {
  it.each(["you@example.com", "first.last+doshi@mail.example.co.jp"])(
    "accepts %s",
    (email) => {
      expect(isPlausibleEmail(email)).toBe(true);
    },
  );

  it.each([
    "",
    "you",
    "you@",
    "you@example",
    "you@example.",
    "@example.com",
    "you@@example.com",
    "you @example.com",
    " you@example.com",
  ])("rejects %p", (email) => {
    expect(isPlausibleEmail(email)).toBe(false);
  });
});
