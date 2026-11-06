"""
Look up an English meaning and part of speech in JMdict for each word in the
extracted Kaishi word list.

JMdict is © the Electronic Dictionary Research and Development Group (EDRDG),
licensed CC BY-SA 4.0 (https://www.edrdg.org/edrdg/licence.html). Shipping
anything derived from it requires attribution in the app and sharing the
derived data under the same license. Input is the JSON edition from
https://github.com/scriptin/jmdict-simplified (`jmdict-eng-*.json`).

Matching is automatic and imperfect: it takes the first JMdict sense that
applies to the word's spelling, which isn't always the sense the list meant.
When the same word + reading appears more than once (e.g. 高い as "tall" and
"expensive"), the nth occurrence takes the nth applicable sense. Review the
output by hand before relying on it: words where two JMdict entries tie are
listed at the end, and wrong picks are corrected in OVERRIDES.

Usage:
    python3 -I scripts/match-jmdict-meanings.py \\
        data/source/kaishi-words.json <path/to/jmdict-eng.json> \\
        data/source/kaishi-meanings.json
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

# Gloss count per meaning, e.g. "high; tall".
MAX_GLOSSES = 2

# JMdict part-of-speech tags → the plain labels the app uses. The first tag
# in a sense that appears here decides the label, except that any verb tag
# wins (verbs are often also tagged as transitive/intransitive).
POS_LABELS = {
    "n": "noun",
    "n-pref": "noun",
    "n-suf": "noun",
    "n-adv": "noun",
    "n-t": "noun",
    "adj-i": "i-adjective",
    "adj-ix": "i-adjective",
    "adj-na": "na-adjective",
    "adj-no": "no-adjective",
    "adj-pn": "pre-noun adjective",
    "adj-t": "adjective",
    "adj-f": "adjective",
    "adv": "adverb",
    "adv-to": "adverb",
    "pn": "pronoun",
    "exp": "expression",
    "int": "interjection",
    "conj": "conjunction",
    "prt": "particle",
    "suf": "suffix",
    "pref": "prefix",
    "ctr": "counter",
    "num": "numeral",
    "cop": "copula",
    "aux": "auxiliary",
    "aux-v": "auxiliary verb",
    "aux-adj": "auxiliary adjective",
    "unc": "other",
}
VAGUE_TAGS = {"exp", "adj-no", "adj-f", "aux"}
CORE_TAGS = ("adj-i", "adj-ix", "adj-na", "n")
VERB_TAG = re.compile(r"^(v1|v1-s|v5.*|vk|vs-i|vs-s|vz|v2.*|v4.*|vr|vs-c|vn)$")
KANJI = re.compile(r"[㐀-鿿々]")
# Hand-picked JMdict entries for words the automatic match gets wrong, keyed
# by (word, reading) as written in the list. Each value is (JMdict entry id,
# sense index or None); the index counts the entry's senses that apply to the
# spelling, and None keeps the usual first-sense pick. Add to this when a tie
# listed in the script's output (or a wrong meaning in the app) picks the
# wrong word. Checked against JMdict 3.6.2 (2026-11-02).
OVERRIDES: dict[tuple[str, str], tuple[str, int | None]] = {
    # Kana-only いる ties between 要る "to be needed" (JMdict's first) and
    # 居る "to be, to exist" — the list has 要る separately (#559).
    ("いる", "いる"): ("1577980", None),  # 居る
    ("そう", "そう"): ("2137720", None),  # 然う "in that way", not the -そう suffix
    ("くらい", "くらい"): ("1154340", None),  # 位 "approximately", not 暗い "dark"
    ("いっぱい", "いっぱい"): ("1165670", 2),  # 一杯 "full", not 一敗 "one defeat"
    ("いくら", "いくら"): ("1219980", None),  # 幾ら "how much", not イクラ "salmon roe"
}

# Some list entries give alternative readings separated by "・" (何: なに・なん).
READING_SEPARATOR = "・"


def to_hiragana(text: str) -> str:
    """Katakana → hiragana, so パン in JMdict matches a reading written ぱん."""
    return "".join(
        chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in text
    )


def pos_label(tags: list[str]) -> str | None:
    if any(VERB_TAG.match(tag) for tag in tags):
        return "verb"
    # A vague first tag gives way to a core word class listed later: 女の子 is
    # tagged "exp" before "n", 普通 "adj-no" before "adj-na". Otherwise
    # JMdict's first tag stands (かなり stays an adverb, 罪 a noun).
    if tags and tags[0] in VAGUE_TAGS:
        for tag in CORE_TAGS:
            if tag in tags:
                return POS_LABELS[tag]
    for tag in tags:
        if tag in POS_LABELS:
            return POS_LABELS[tag]
    return None


def applies(restriction: list[str], form: str) -> bool:
    return "*" in restriction or form in restriction


def candidates(entries_by_form, word: str, reading: str) -> list[tuple[int, dict]]:
    """(score, JMdict entry) pairs for this spelling, best first."""
    kana_only = not KANJI.search(word)
    found = []
    for entry in entries_by_form.get(word, []):
        kanji = next((k for k in entry["kanji"] if k["text"] == word), None)
        kana = next(
            (
                k
                for k in entry["kana"]
                if to_hiragana(k["text"]) == to_hiragana(reading)
                and (kana_only or applies(k["appliesToKanji"], word))
            ),
            None,
        )
        if kana is None or (not kana_only and kanji is None):
            continue
        usually_kana = any("uk" in sense["misc"] for sense in entry["sense"][:1])
        score = (
            # Kana-only words: prefer entries with no kanji or usually written in kana.
            (2 if kana_only and (not entry["kanji"] or usually_kana) else 0)
            + (1 if kana["common"] else 0)
            + (1 if kanji and kanji["common"] else 0)
        )
        found.append((score, entry))
    # Stable sort keeps JMdict's own order among equals.
    found.sort(key=lambda pair: -pair[0])
    return found


def applicable_senses(entry: dict, word: str, reading: str) -> list[dict]:
    kana_only = not KANJI.search(word)
    senses = []
    previous_pos: list[str] = []
    for sense in entry["sense"]:
        # Like JMdict itself, a sense with no part of speech inherits the previous one.
        pos = sense["partOfSpeech"] or previous_pos
        previous_pos = pos
        if (kana_only or applies(sense["appliesToKanji"], word)) and any(
            to_hiragana(kana) == to_hiragana(reading)
            for kana in kana_forms(entry, sense)
        ):
            senses.append({**sense, "partOfSpeech": pos})
    return senses


def kana_forms(entry: dict, sense: dict) -> list[str]:
    """The kana spellings a sense applies to."""
    return [
        kana["text"]
        for kana in entry["kana"]
        if applies(sense["appliesToKana"], kana["text"])
    ]


def lookup(entries_by_form, word: str, reading: str):
    """
    (entry, applicable senses, tied) for the first reading that matches.
    `tied` is true when another entry scored as well as the one picked, so
    the pick came down to JMdict's order and is worth checking by hand.
    """
    override = OVERRIDES.get((word, reading), (None, None))[0]
    for alternative in reading.split(READING_SEPARATOR):
        found = candidates(entries_by_form, word, alternative)
        if override is not None:
            found = [pair for pair in found if pair[1]["id"] == override]
            if not found:
                sys.exit(
                    f"Override for {word} ({reading}) names JMdict entry "
                    f"{override}, which doesn't match that spelling"
                )
        if found:
            entry = found[0][1]
            senses = applicable_senses(entry, word, alternative)
            if senses:
                tied = len(found) > 1 and found[1][0] == found[0][0]
                return entry, senses, tied
    return None, [], False


def main() -> None:
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    words_path, jmdict_path, output_path = map(Path, sys.argv[1:])
    words = json.loads(words_path.read_text(encoding="utf-8"))
    jmdict = json.loads(jmdict_path.read_text(encoding="utf-8"))

    # Index every entry by each of its kanji and kana spellings.
    entries_by_form = defaultdict(list)
    for entry in jmdict["words"]:
        for form in entry["kanji"] + entry["kana"]:
            entries_by_form[form["text"]].append(entry)

    occurrences: dict[tuple[str, str], int] = defaultdict(int)
    meanings, unmatched, ties = [], [], []
    for item in words:
        word, reading = item["word"], item["reading"]
        occurrence = occurrences[(word, reading)]
        occurrences[(word, reading)] += 1

        entry, senses, tied = lookup(entries_by_form, word, reading)
        if entry is None:
            unmatched.append(item)
            continue
        if tied and (word, reading) not in OVERRIDES:
            ties.append((item, entry))
        override_sense = OVERRIDES.get((word, reading), (None, None))[1]
        sense = senses[
            override_sense
            if override_sense is not None
            else min(occurrence, len(senses) - 1)
        ]
        meanings.append(
            {
                "guid": item["guid"],
                "meaning": "; ".join(g["text"] for g in sense["gloss"][:MAX_GLOSSES]),
                "partOfSpeech": pos_label(sense["partOfSpeech"]),
                "jmdictId": entry["id"],
            }
        )

    output_path.write_text(
        json.dumps(meanings, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Matched {len(meanings)} of {len(words)} words → {output_path}")
    print(f"JMdict {jmdict['version']}, dictionary date {jmdict['dictDate']}")
    if unmatched:
        print(f"Unmatched ({len(unmatched)}):")
        for item in unmatched:
            print(f"  #{item['position']} {item['word']} ({item['reading']})")
    if ties:
        print(
            f"Tied with another JMdict entry ({len(ties)}) — check these and "
            "add an OVERRIDES entry for any wrong pick:"
        )
        for item, entry in ties:
            spelling = entry["kanji"][0]["text"] if entry["kanji"] else entry["kana"][0]["text"]
            print(f"  #{item['position']} {item['word']} ({item['reading']}) → {spelling} [{entry['id']}]")
    no_pos = [m for m in meanings if m["partOfSpeech"] is None]
    if no_pos:
        print(f"No part-of-speech label for {len(no_pos)} words")


if __name__ == "__main__":
    main()
