/**
 * Doshi's own notes on words, shown as "Note" with the meaning — e.g. for a
 * word whose meaning alone says little (さん's meaning in the deck is just
 * "san"). Optional: most words have none.
 *
 * Written for Doshi, not taken from Kaishi, so they live here rather than in
 * data/words.json, which is generated (rerunning the script would wipe them).
 * Not to be confused with a word's `notes`, which are Kaishi's own and not
 * shown. Each note names its word by id (the Kaishi note's guid) and repeats
 * the word itself, so a test can catch a note attached to the wrong word.
 */
export type DoshiNote = {
  id: string;
  word: string;
  text: string;
};

export const DOSHI_NOTES: readonly DoshiNote[] = [
  {
    id: "l^^i5RVwq@",
    word: "さん",
    text: "Like Mr., Mrs. or Ms., but it goes after the name: Tom-san.",
  },
  {
    id: "co94A,*H>6",
    word: "ちゃん",
    text: "Like an affectionate nickname, used mostly for children, girls and close friends. It goes after the name: Lara-chan.",
  },
];
