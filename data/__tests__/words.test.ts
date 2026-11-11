// TypeScript 6 no longer loads @types packages automatically; this scopes
// Jest's globals (describe, it, expect) to this file instead of all app code.
/// <reference types="jest" />

import { DICTIONARY_WORDS } from "@/data/dictionary-words";

// HTML, entities, [sound:] tags and Anki furigana (漢字[かんじ]).
const MARKUP = /<|>|&[#\w]+;|\[sound:|\[[^\]]*\]/;

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(strings);
  }
  return [];
}

describe("data/words.json", () => {
  it("has the 1,500 Kaishi words in order", () => {
    expect(DICTIONARY_WORDS).toHaveLength(1500);
    DICTIONARY_WORDS.forEach((word, index) => {
      expect(word.position).toBe(index + 1);
    });
  });

  it("has unique ids", () => {
    const ids = new Set(DICTIONARY_WORDS.map((word) => word.id));
    expect(ids.size).toBe(DICTIONARY_WORDS.length);
  });

  it("gives every word a word, reading and meaning", () => {
    for (const word of DICTIONARY_WORDS) {
      expect(word.word).not.toBe("");
      expect(word.reading).not.toBe("");
      expect(word.meaning).not.toBe("");
    }
  });

  it("contains no markup", () => {
    for (const { id, ...content } of DICTIONARY_WORDS) {
      for (const text of strings(content)) {
        expect({ id, text, markup: MARKUP.test(text) }).toEqual({
          id,
          text,
          markup: false,
        });
      }
    }
  });

  it("builds each sentence from its segments", () => {
    for (const { sentence } of DICTIONARY_WORDS) {
      if (!sentence) continue;
      expect(sentence.segments.map((segment) => segment.text).join("")).toBe(
        sentence.text,
      );
      expect(sentence.translation).not.toBe("");
    }
  });

  it("draws pitch with one H or L per mora plus a following particle", () => {
    for (const { pitchAccent } of DICTIONARY_WORDS) {
      for (const pattern of pitchAccent?.patterns ?? []) {
        const moras = pattern.kana.replace(/[ァィゥェォャュョヮ]/g, "").length;
        expect(pattern.pitch).toMatch(/^[HL]+$/);
        expect(pattern.pitch).toHaveLength(moras + 1);
      }
    }
  });
});
