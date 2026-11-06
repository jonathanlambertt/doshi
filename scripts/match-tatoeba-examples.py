"""
Pick one example sentence, with its English translation, from Tatoeba for each
word in the extracted Kaishi word list.

Tatoeba sentences are licensed CC BY 2.0 FR (some CC0) — see
https://tatoeba.org/en/terms_of_use. Shipping them requires attribution; each
example keeps its Tatoeba sentence ids so it can be credited and linked.

Words are matched through Tatoeba's Japanese index (`jpn_indices.csv`, the
Tanaka Corpus word lists), which records the dictionary form of every word in
a sentence. A word matches an index entry when the entry's headword is one of
the word's JMdict spellings (from kaishi-meanings.json's jmdictId), and its
reading, if given, is one of the entry's readings.

A sentence only qualifies as an example when:
- it writes the word the way the app shows it (誰, not だれ; いる, not 居る),
  so the word can be highlighted in it;
- it is short (MIN_LENGTH–MAX_LENGTH characters);
- it is family friendly: no term from BLOCKED_JAPANESE / BLOCKED_ENGLISH,
  unless the term is the word itself.
Among those, the simplest wins: fewest other words that aren't in the list,
then sentences an editor marked as good examples (`~`), then the shortest.

The automatic pick is then reviewed by hand. The picks file (optional,
gitignored like the rest of data/source/) maps a word's guid to the Tatoeba
sentence id to use instead, or to null for "no good example — show none".
A hand pick only has to contain the word; the other rules don't apply.

Inputs (from https://downloads.tatoeba.org/exports/):
  jpn_indices.csv     jpn_indices.tar.bz2
  jpn_sentences.tsv   per_language/jpn/jpn_sentences.tsv.bz2
  eng_sentences.tsv   per_language/eng/eng_sentences.tsv.bz2
plus the JMdict JSON used by match-jmdict-meanings.py.

Usage:
    python3 -I scripts/match-tatoeba-examples.py \\
        data/source/kaishi-words.json data/source/kaishi-meanings.json \\
        <jmdict-eng.json> <jpn_indices.csv> <jpn_sentences.tsv> \\
        <eng_sentences.tsv> data/source/kaishi-examples.json \\
        [--picks data/source/kaishi-example-picks.json] \\
        [--candidates <review.tsv>]

--candidates writes every word's best qualifying sentences (up to
CANDIDATES_PER_WORD), one per line, for reviewing the picks.
"""

import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path

# Example length limits, in characters of the Japanese sentence. Very short
# sentences rarely show how a word is used; long ones are hard for beginners.
MIN_LENGTH = 5
MAX_LENGTH = 20
CANDIDATES_PER_WORD = 10

# Topics kept out of examples. BLOCKED_JAPANESE matches substrings of the
# Japanese sentence. BLOCKED_ENGLISH matches whole English words with a plain
# inflection (kill, kills, killed, killing), so "fat" doesn't block "father";
# BLOCKED_ENGLISH_STEMS match any word starting with them (racism, racist).
BLOCKED_JAPANESE = [
    "殺", "死", "憎", "差別", "偏見", "戦争", "爆", "銃", "武器", "兵",
    "酒", "ビール", "ワイン", "ウイスキー", "ウィスキー", "酔", "飲み屋",
    "タバコ", "たばこ", "煙草", "麻薬", "薬物", "ドラッグ",
    "血", "傷", "暴力", "殴", "犯罪", "犯人", "泥棒", "盗", "刑務所", "逮捕",
    "自殺", "地獄", "悪魔", "神", "宗教", "政治", "選挙", "首相", "大統領",
    "ユダヤ", "黒人", "白人", "人種", "セックス", "裸", "キス", "愛人", "浮気",
    "離婚", "ギャンブル", "賭", "クソ", "くそ", "バカ", "ばか", "馬鹿", "アホ",
    "ブス", "デブ", "うざ", "嫌い", "飲み過ぎ", "飲みすぎ", "一杯", "居酒屋",
]
BLOCKED_ENGLISH = [
    "hate", "kill", "die", "died", "dying", "dead", "death", "murder",
    "suicide", "prejudice", "jew", "black", "white people", "war", "bomb",
    "gun", "weapon", "soldier", "army", "alcohol", "drunk", "beer", "wine",
    "sake", "liquor", "booze", "bar", "pub", "tobacco", "drug", "blood",
    "hurt", "wound", "hit", "punch", "crime", "criminal", "thief", "steal",
    "stole", "stolen", "rob", "robbed", "robbery", "prison", "jail",
    "arrest", "police", "hell", "devil", "god", "election", "president",
    "prime minister", "sex", "naked", "nude", "kiss", "lover", "affair",
    "divorce", "bet", "damn", "shit", "fuck", "stupid", "idiot", "fool",
    "ugly", "fat", "dislike", "drank", "a drink", "drinking", "hangover",
]
BLOCKED_ENGLISH_STEMS = [
    "racis", "whisk", "cigar", "smok", "violen", "religio", "politic", "gambl",
]
BLOCKED_ENGLISH_PATTERN = re.compile(
    r"\b(?:"
    + "|".join(rf"(?P<w{i}>{re.escape(t)})(?:s|es|ed|d|ing)?\b" for i, t in enumerate(BLOCKED_ENGLISH))
    + "|"
    + "|".join(rf"(?P<s{i}>{re.escape(t)})\w*" for i, t in enumerate(BLOCKED_ENGLISH_STEMS))
    + ")",
    re.IGNORECASE,
)

# One index entry: headword, then optional (reading or #JMdict id), [sense],
# {form as written in the sentence}, and ~ for an editor-checked example.
INDEX_ENTRY = re.compile(
    r"^(?P<headword>[^(\[{~]+)"
    r"(?:\((?P<reading>[^)]*)\))?"
    r"(?:\[\d+\])?"
    r"(?:\{(?P<form>[^}]*)\})?"
    r"(?P<checked>~)?$"
)
KANJI = re.compile(r"[㐀-鿿々]")
HIRAGANA = re.compile(r"^[ぁ-ゖー]+$")
# Words whose highlight is the inflected form (行った), not just the stem.
INFLECTING = {"verb", "i-adjective"}


def to_hiragana(text: str) -> str:
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in text)


def load_sentences(path: Path, wanted: set[str]) -> dict[str, str]:
    """Sentence id → text, from a Tatoeba per-language export (id, lang, text)."""
    sentences = {}
    with path.open(encoding="utf-8") as file:
        for row in csv.reader(file, delimiter="\t", quoting=csv.QUOTE_NONE):
            if len(row) >= 3 and row[0] in wanted:
                sentences[row[0]] = row[2]
    return sentences


def stem(word: str) -> str:
    """
    The part of a word that stays the same when it inflects: 行く → 行,
    好き → 好, いる → い. Words without kana endings are their own stem.
    """
    if KANJI.search(word):
        end = len(word)
        while end > 1 and not KANJI.search(word[end - 1]):
            end -= 1
        # Keep the ending of words that end in kana but don't inflect (お金).
        return word[:end] if end < len(word) else word
    return word[:-1] if len(word) > 1 else word


def highlight_for(word: str, form: str, text: str, part_of_speech: str | None):
    """
    The part of the sentence to highlight, or None when the sentence doesn't
    write the word the way the app shows it.
    """
    if form not in text:
        return None
    if part_of_speech not in INFLECTING:
        # Nouns and the like don't inflect: the sentence must spell the word
        # exactly as shown (私たち, not 私達).
        return word if word in form else None
    word_stem = stem(word)
    if not form.startswith(word_stem):
        return None
    # A kana word must stay kana: いない for いる, never 居ない.
    if not KANJI.search(word) and KANJI.search(form):
        return None
    return form


def is_family_friendly(japanese: str, english: str, word: str, meaning: str) -> bool:
    for term in BLOCKED_JAPANESE:
        if term in japanese and term not in word:
            return False
    for match in BLOCKED_ENGLISH_PATTERN.finditer(english):
        term = next(group for group in match.groups() if group)
        if term.lower() not in meaning.lower():
            return False
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    for name in (
        "words",
        "meanings",
        "jmdict",
        "indices",
        "jpn_sentences",
        "eng_sentences",
        "output",
    ):
        parser.add_argument(name, type=Path)
    parser.add_argument("--picks", type=Path)
    parser.add_argument("--candidates", type=Path)
    args = parser.parse_args()

    words = json.loads(args.words.read_text(encoding="utf-8"))
    meanings = {
        m["guid"]: m for m in json.loads(args.meanings.read_text(encoding="utf-8"))
    }
    picks: dict[str, str | None] = (
        json.loads(args.picks.read_text(encoding="utf-8"))
        if args.picks and args.picks.exists()
        else {}
    )
    jmdict = {
        entry["id"]: entry
        for entry in json.loads(args.jmdict.read_text(encoding="utf-8"))["words"]
    }

    # Every JMdict entry a list word maps to, by each of its spellings.
    wanted_ids = {m["jmdictId"] for m in meanings.values()}
    ids_by_headword: dict[str, set[str]] = defaultdict(set)
    for entry_id in wanted_ids:
        entry = jmdict[entry_id]
        for form in entry["kanji"] + entry["kana"]:
            ids_by_headword[form["text"]].add(entry_id)

    # JMdict entry id → (sentence id, translation id, form, checked) per use,
    # and sentence id → how many of its words aren't in the list.
    found: dict[str, list[tuple[str, str, str, bool]]] = defaultdict(list)
    unknown_words: dict[str, int] = {}
    with args.indices.open(encoding="utf-8") as file:
        for row in csv.reader(file, delimiter="\t", quoting=csv.QUOTE_NONE):
            if len(row) < 3 or row[1] in ("", "0", "-1"):
                continue  # No English translation linked.
            sentence_id, translation_id = row[0], row[1]
            unknown = 0
            for token in row[2].split():
                match = INDEX_ENTRY.match(token)
                if not match:
                    continue
                headword, reading = match["headword"], match["reading"]
                entry_ids = ids_by_headword.get(headword, set())
                # Particles and other short kana function words don't count.
                if not entry_ids and not (len(headword) <= 2 and HIRAGANA.match(headword)):
                    unknown += 1
                for entry_id in entry_ids:
                    entry = jmdict[entry_id]
                    if reading:
                        if reading.startswith("#"):
                            if reading[1:] != entry_id:
                                continue
                        elif to_hiragana(reading) not in {
                            to_hiragana(k["text"]) for k in entry["kana"]
                        }:
                            continue
                    found[entry_id].append(
                        (
                            sentence_id,
                            translation_id,
                            match["form"] or headword,
                            bool(match["checked"]),
                        )
                    )
            unknown_words[sentence_id] = unknown

    needed_jpn = {c[0] for cs in found.values() for c in cs}
    needed_eng = {c[1] for cs in found.values() for c in cs}
    japanese = load_sentences(args.jpn_sentences, needed_jpn)
    english = load_sentences(args.eng_sentences, needed_eng)

    examples, missing, review_lines = [], [], []
    for item in words:
        guid, word = item["guid"], item["word"]
        meaning = meanings.get(guid)
        part_of_speech = meaning["partOfSpeech"] if meaning else None
        gloss = meaning["meaning"] if meaning else ""

        # Every sentence that writes the word as shown, best first.
        options, seen = [], set()
        for sentence_id, translation_id, form, checked in (
            found.get(meaning["jmdictId"], []) if meaning else []
        ):
            text, translation = japanese.get(sentence_id), english.get(translation_id)
            if not text or not translation or sentence_id in seen:
                continue
            highlight = highlight_for(word, form, text, part_of_speech)
            if highlight is None:
                continue
            seen.add(sentence_id)
            qualifies = MIN_LENGTH <= len(text) <= MAX_LENGTH and is_family_friendly(
                text, translation, word, gloss
            )
            options.append(
                (
                    not qualifies,
                    unknown_words.get(sentence_id, 0),
                    not checked,
                    len(text),
                    sentence_id,
                    translation_id,
                    text,
                    translation,
                    highlight,
                )
            )
        options.sort()

        if guid in picks:
            pick_id = picks[guid]
            chosen = next((o for o in options if o[4] == pick_id), None)
            if pick_id is not None and chosen is None:
                raise SystemExit(
                    f"Pick for #{item['position']} {word}: Tatoeba sentence "
                    f"{pick_id} isn't a sentence that contains the word"
                )
        else:
            chosen = options[0] if options and not options[0][0] else None

        if args.candidates:
            for option in [o for o in options if not o[0]][:CANDIDATES_PER_WORD]:
                review_lines.append(
                    "\t".join(
                        [
                            str(item["position"]),
                            word,
                            gloss,
                            option[4],
                            option[6],
                            option[7],
                            "*" if chosen and option[4] == chosen[4] else "",
                        ]
                    )
                )

        if chosen is None:
            missing.append(item)
            continue
        *_, sentence_id, translation_id, text, translation, highlight = chosen
        examples.append(
            {
                "guid": guid,
                "japanese": text,
                "english": translation,
                "form": highlight,
                "tatoebaId": sentence_id,
                "tatoebaTranslationId": translation_id,
            }
        )

    args.output.write_text(
        json.dumps(examples, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    if args.candidates:
        args.candidates.write_text("\n".join(review_lines) + "\n", encoding="utf-8")
    print(f"Examples for {len(examples)} of {len(words)} words → {args.output}")
    if picks:
        print(f"Hand picks applied: {len(picks)}")
    if missing:
        print(f"No example ({len(missing)}):")
        for item in missing:
            print(f"  #{item['position']} {item['word']} ({item['reading']})")


if __name__ == "__main__":
    main()
