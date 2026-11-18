// TypeScript 6 no longer loads @types packages automatically; this scopes
// Jest's globals (describe, it, expect) to this file instead of all app code.
/// <reference types="jest" />

import { DICTIONARY_WORDS, getDictionaryWord } from "@/data/dictionary-words";
import { DOSHI_NOTES } from "@/data/doshi-notes";

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

describe("data/doshi-notes.ts", () => {
  it("attaches each note to the word it names", () => {
    for (const note of DOSHI_NOTES) {
      expect({ id: note.id, word: getDictionaryWord(note.id)?.word }).toEqual({
        id: note.id,
        word: note.word,
      });
    }
  });

  it("has at most one note per word", () => {
    const ids = new Set(DOSHI_NOTES.map((note) => note.id));
    expect(ids.size).toBe(DOSHI_NOTES.length);
  });

  it("gives every note some text", () => {
    for (const note of DOSHI_NOTES) {
      expect(note.text.trim()).not.toBe("");
    }
  });

  it("shows さん as Mr., Mrs. or Ms.", () => {
    const san = getDictionaryWord("l^^i5RVwq@");
    expect(san?.word).toBe("さん");
    expect(san?.doshiNote).toContain("Mr., Mrs. or Ms.");
  });

  it("shows ちゃん as an affectionate nickname", () => {
    const chan = getDictionaryWord("co94A,*H>6");
    expect(chan?.word).toBe("ちゃん");
    expect(chan?.doshiNote).toContain("affectionate nickname");
  });

  it("leaves every other word without a note", () => {
    const noted = new Set(DOSHI_NOTES.map((note) => note.id));
    for (const word of DICTIONARY_WORDS) {
      if (!noted.has(word.id)) expect(word.doshiNote).toBeNull();
    }
  });
});
