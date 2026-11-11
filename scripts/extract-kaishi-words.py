"""
Build data/words.json, Doshi's word list, from the Kaishi 1.5k deck (.apkg).

Each word, in deck order, gets its id (the note's guid, so stored progress
stays attached to the right word), position, word, reading, meaning, notes,
pitch accent and example sentence. Every field is turned into plain text or
structured data: the output never contains HTML, [sound:] tags or Anki's
furigana syntax. The Picture, Word Audio and Sentence Audio fields are never
read. See "Vocabulary data" in README.md for what ships from the deck.

Usage:
    python3 -I scripts/extract-kaishi-words.py <path/to/Kaishi.1.5k.apkg>

The deck is opened read-only (its collection is decompressed into a temporary
copy). Running the script again on the same deck writes an identical file.

Requires Python 3.14+ (for compression.zstd, used to read modern .apkg files).
"""

import html
import json
import re
import sqlite3
import sys
import tempfile
import zipfile
from compression import zstd
from html.parser import HTMLParser
from pathlib import Path

NOTETYPE_NAME = "Kaishi 1.5k"
FIELD_SEPARATOR = "\x1f"
OUTPUT = Path(__file__).resolve().parent.parent / "data" / "words.json"

# The only fields read. Picture, Word Audio and Sentence Audio are not listed,
# so they are never touched.
FIELDS = (
    "Word",
    "Word Reading",
    "Word Meaning",
    "Sentence",
    "Sentence Meaning",
    "Sentence Furigana",
    "Notes",
    "Pitch Accent",
    "Pitch Accent Notes",
)

_HIGH_DROP = (
    '<span style="display:inline-block;position:relative;'
    'padding-right:0.1em;margin-right:0.1em;">'
)
_LINE_DROP = (
    '<span style="border-color:currentColor;display:block;user-select:none;'
    "pointer-events:none;position:absolute;top:0.1em;left:0;right:0;height:0;"
    "border-top-width:0.1em;border-top-style:solid;right:-0.1em;height:0.4em;"
    'border-right-width:0.1em;border-right-style:solid;"></span>'
)

# Authoring slips in v2.4.3, repaired by exact text: (word, field, broken
# text) → replacement. Each must be found, so a deck update that changes one
# fails the build instead of being guessed at.
REPAIRS: dict[tuple[str, str, str], str] = {
    # A broken duplicate of the <b> tag around the word.
    ("素晴らしい", "Sentence", '<b素晴らしい< b="">'): "",
    ("素晴らしい", "Sentence", "</b素晴らしい<>"): "",
    # Overlines nested inside one another, with the * note marker inside
    # them. Redrawn as the single overline the inner marks describe:
    # シツレイシマ＼ス.
    (
        "失礼します",
        "Pitch Accent",
        f'{_HIGH_DROP}{_HIGH_DROP}<span style="display:inline;">ツ</span>'
        f'{_LINE_DROP}</span>レイシ{_HIGH_DROP}<span style="display:inline;">'
        f"マ</span>{_LINE_DROP}</span>ス*</span>",
    ): f'{_HIGH_DROP}<span style="display:inline;">ツレイシマ</span>{_LINE_DROP}</span>ス*',
}


class BuildError(Exception):
    pass


# --- Opening the deck ---------------------------------------------------------


def open_collection(apkg: Path, workdir: Path) -> sqlite3.Connection:
    # Modern .apkg files keep the real collection in a zstd-compressed
    # `collection.anki21b`; `collection.anki2` is a placeholder for old Anki.
    with zipfile.ZipFile(apkg) as archive:
        compressed = archive.read("collection.anki21b")
    database = workdir / "collection.sqlite"
    database.write_bytes(zstd.decompress(compressed))
    db = sqlite3.connect(database)
    # Anki declares some text columns with its own case-insensitive collation.
    db.create_collation("unicase", _unicase)
    return db


def _unicase(a: str, b: str) -> int:
    a, b = a.casefold(), b.casefold()
    return (a > b) - (a < b)


def read_notes(db: sqlite3.Connection) -> list[tuple[str, dict[str, str]]]:
    """(guid, {field: raw value}) for every note, in deck order."""
    (notetype_id,) = db.execute(
        "select id from notetypes where name = ?", (NOTETYPE_NAME,)
    ).fetchone()
    field_names = [
        name
        for (name,) in db.execute(
            "select name from fields where ntid = ? order by ord", (notetype_id,)
        )
    ]
    indexes = {name: field_names.index(name) for name in FIELDS}

    # Every card is new, and a new card's `due` is its position in the deck's
    # learning queue — i.e. the order the deck intends words to be learned.
    rows = db.execute(
        """
        select n.guid, n.flds
        from cards c join notes n on n.id = c.nid
        where n.mid = ?
        order by c.due, n.id
        """,
        (notetype_id,),
    ).fetchall()
    notes = []
    for guid, fields in rows:
        values = fields.split(FIELD_SEPARATOR)
        notes.append((guid, {name: values[i] for name, i in indexes.items()}))
    return notes


# --- Plain text ---------------------------------------------------------------


class _TextParser(HTMLParser):
    """HTML → plain text: <br> and <div> become line breaks, and a link keeps
    its address in parentheses after its text."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.links: list[str | None] = []

    def handle_starttag(self, tag, attrs):
        if tag in ("br", "div"):
            self.parts.append("\n")
        elif tag == "a":
            self.links.append(dict(attrs).get("href"))
        elif tag not in ("b", "i", "u", "span"):
            raise BuildError(f"unexpected <{tag}>")

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag == "div":
            self.parts.append("\n")
        elif tag == "a":
            href = self.links.pop() if self.links else None
            if href:
                self.parts.append(f" ({href})")

    def handle_data(self, data):
        # Line breaks in the source are HTML whitespace, not real breaks.
        self.parts.append(re.sub(r"\s+", " ", data.replace("\xa0", " ")))


def to_text(value: str) -> str:
    parser = _TextParser()
    parser.feed(value)
    parser.close()
    lines = [
        re.sub(r" {2,}", " ", line).strip()
        for line in "".join(parser.parts).split("\n")
    ]
    return "\n".join(line for line in lines if line)


# --- Pitch accent -------------------------------------------------------------

_SMALL_KANA = set("ァィゥェォャュョヮヵヶ")
_NASAL_VOICING = dict(zip("カキクケコ", "ガギグゲゴ"))
_DEVOICED_STYLES = ("color:royalblue;", "color:rgb(65,105,225);")


class _PitchParser(HTMLParser):
    """Reads one pitch accent drawing: each character with whether it sits
    under the overline, and where an overline ends in a drop."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.chars: list[dict] = []
        self.stack: list[str] = []  # the role of each open tag
        self.drops: set[int] = set()  # character counts where a drop is drawn

    def handle_starttag(self, tag, attrs):
        if tag == "br" and self.stack and self.stack[-1] == "line":
            return  # a stray <br> inside the drawn line; it draws nothing
        if tag != "span":
            raise BuildError(f"unexpected <{tag}> in pitch accent")
        style = (dict(attrs).get("style") or "").replace(" ", "")
        if style.startswith("display:inline-block"):
            role = "high-drop" if "padding-right" in style else "high"
        elif style == "text-decoration:overline;":
            role = "high"
        elif style.startswith("border-color"):
            role = "line"  # the drawn overline itself; carries no text
        elif style in ("display:inline;", ""):
            role = "plain"
        elif style in _DEVOICED_STYLES:
            role = "devoiced"
        elif style == "color:red;":
            role = "nasal"
        else:
            raise BuildError(f"unknown pitch accent style {style!r}")
        self.stack.append(role)

    def handle_endtag(self, tag):
        if tag == "br":
            return
        if self.stack.pop() == "high-drop":
            self.drops.add(len(self.chars))

    def handle_data(self, data):
        if "line" in self.stack:
            if data.strip():
                raise BuildError("text inside the drawn overline")
            return
        high = "high" in self.stack or "high-drop" in self.stack
        for char in data:
            self.chars.append(
                {
                    "char": char,
                    "high": high,
                    "devoiced": "devoiced" in self.stack,
                    "nasal": "nasal" in self.stack,
                }
            )


def parse_pitch_pattern(drawing: str) -> dict:
    """One drawn pattern → {kana, pitch, nasal, devoiced}.

    `pitch` has one H or L per mora, plus one more for a particle after the
    word: あなた LHLL, わたし LHHH (flat: a particle stays high), いぬ LHL (the
    drop comes after the word). `nasal` (a nasal g, as in ニホンゴ) and
    `devoiced` list 1-based moras.
    """
    parser = _PitchParser()
    parser.feed(drawing)
    parser.close()
    if parser.stack:
        raise BuildError("unclosed tag in pitch accent")

    moras: list[dict] = []
    for char in parser.chars:
        c = char["char"]
        if c == "°":
            # The nasal mark belongs to the mora before it, which the deck
            # writes unvoiced (コ° for a nasal ゴ).
            if not moras or not char["nasal"] or moras[-1]["kana"][0] not in _NASAL_VOICING:
                raise BuildError("stray nasal mark")
            mora = moras[-1]
            mora["kana"] = _NASAL_VOICING[mora["kana"][0]] + mora["kana"][1:]
            mora["nasal"] = True
        elif c in _SMALL_KANA:
            if not moras:
                raise BuildError("pattern starts with a small kana")
            moras[-1]["kana"] += c
        elif "ァ" <= c <= "ヺ" or c == "ー":
            moras.append(
                {"kana": c, "high": char["high"], "devoiced": char["devoiced"], "nasal": False}
            )
        else:
            raise BuildError(f"unexpected {c!r} in pitch accent")
    if not moras:
        raise BuildError("empty pitch accent pattern")

    # A particle after the word stays high only if the word ends high without
    # a drawn drop.
    particle_high = moras[-1]["high"] and len(parser.chars) not in parser.drops
    pitch = "".join("H" if mora["high"] else "L" for mora in moras)
    return {
        "kana": "".join(mora["kana"] for mora in moras),
        "pitch": pitch + ("H" if particle_high else "L"),
        "nasal": [i for i, mora in enumerate(moras, 1) if mora["nasal"]],
        "devoiced": [i for i, mora in enumerate(moras, 1) if mora["devoiced"]],
    }


def parse_pitch_accent(value: str) -> list[dict]:
    # Patterns are separated by ・. A trailing * points to the pitch accent
    # notes, which are kept separately.
    value = value.replace("　", " ").strip().removesuffix("*").strip()
    if not value:
        return []
    return [parse_pitch_pattern(part.strip()) for part in value.split("・")]


def is_regular_pitch(pitch: str) -> bool:
    """Whether a pattern is one Tokyo-style accent phrase: the first two moras
    differ, then one high run that drops at most once."""
    if len(pitch) == 2:
        return True
    return re.fullmatch(r"HL+|LH+L*", pitch) is not None


def _katakana_to_hiragana(kana: str) -> str:
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in kana)


def _split_moras(kana: str) -> list[str]:
    moras: list[str] = []
    for c in kana:
        if c in _SMALL_KANA and moras:
            moras[-1] += c
        else:
            moras.append(c)
    return moras


# A pitch accent drawing written inside the pitch accent notes, with the plain
# katakana around it.
_INLINE_DRAWING = re.compile(
    r"[ァ-ヺー]*<span style=\"display:inline-block;[^\"]*\">"
    r"<span style=\"display:inline;\">[ァ-ヺー]*</span>"
    r"<span style=\"[^\"]*\"></span></span>[ァ-ヺー]*"
)


def pitch_notes_to_text(value: str) -> str:
    """Pitch accent notes as text, with any drawing turned into the ＼ / ￣
    notation the notes already use (いつのま＼にか, ひと￣)."""

    def notation(match: re.Match) -> str:
        pattern = parse_pitch_pattern(match.group())
        moras = _split_moras(pattern["kana"])
        pitch = pattern["pitch"]
        if pitch.endswith("HH"):
            return _katakana_to_hiragana("".join(moras)) + "￣"
        drop = pitch.rindex("H") + 1
        return _katakana_to_hiragana("".join(moras[:drop]) + "＼" + "".join(moras[drop:]))

    return to_text(_INLINE_DRAWING.sub(notation, value))


# --- Example sentence ---------------------------------------------------------

# Anki furigana: `base[reading]`. The base runs back from the bracket to the
# previous space, and that space is only a separator.
_FURIGANA = re.compile(r" ?([^ \[\]]+)\[([^\]]+)\]")
_KANA = re.compile(r"[぀-ヿ]")


class _SentenceParser(HTMLParser):
    """Sentence Furigana → segments of {text, reading?, highlight?}."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.segments: list[dict] = []
        self.bold = 0

    def handle_starttag(self, tag, attrs):
        if tag == "b":
            self.bold += 1
        elif tag == "br":
            self._add("\n", None)
        else:
            raise BuildError(f"unexpected <{tag}> in sentence")

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag != "b" or self.bold == 0:
            raise BuildError(f"unexpected </{tag}> in sentence")
        self.bold -= 1

    def handle_data(self, data):
        data = data.replace("\xa0", " ")
        at = 0
        for match in _FURIGANA.finditer(data):
            self._add(data[at : match.start()], None)
            self._add_with_reading(match.group(1), match.group(2))
            at = match.end()
        self._add(data[at:], None)

    def _add_with_reading(self, base: str, reading: str):
        # Kana at either end of the base that the reading repeats isn't part
        # of what the reading covers.
        prefix = 0
        while (
            prefix < len(base) - 1
            and base[prefix] == reading[prefix : prefix + 1]
            and _KANA.match(base[prefix])
        ):
            prefix += 1
        suffix = 0
        while (
            suffix < len(base) - prefix - 1
            and len(reading) - prefix - suffix > 1
            and base[-1 - suffix] == reading[-1 - suffix]
            and _KANA.match(base[-1 - suffix])
        ):
            suffix += 1
        self._add(base[:prefix], None)
        self._add(base[prefix : len(base) - suffix], reading[prefix : len(reading) - suffix])
        self._add(base[len(base) - suffix :], None)

    def _add(self, text: str, reading: str | None):
        if not text:
            return
        segment: dict = {"text": text}
        if reading is not None:
            segment["reading"] = reading
        if self.bold:
            segment["highlight"] = True
        self.segments.append(segment)


def _is_wide(char: str) -> bool:
    return ord(char) > 0x2E7F


def _tidy_segments(segments: list[dict]) -> list[dict]:
    """Drops spaces that only separate Japanese characters (Japanese text has
    none), trims line breaks and spaces at the ends, and merges neighbors that
    have no reading and the same highlight."""
    text = "".join(segment["text"] for segment in segments)
    keep: list[bool] = []
    for index, char in enumerate(text):
        if char == " ":
            before = text[:index].rstrip(" ")[-1:]
            after = text[index + 1 :].lstrip(" ")[:1]
            keep.append(not (before and after and (_is_wide(before) or _is_wide(after))))
        else:
            keep.append(True)
    start = len(text) - len(text.lstrip())
    end = len(text.rstrip())

    tidied: list[dict] = []
    at = 0
    for segment in segments:
        chars = [
            c
            for offset, c in enumerate(segment["text"])
            if keep[at + offset] and start <= at + offset < end
        ]
        at += len(segment["text"])
        if not chars:
            if "reading" in segment:
                raise BuildError("a reading lost its text")
            continue
        piece = {**segment, "text": "".join(chars)}
        last = tidied[-1] if tidied else None
        if (
            last is not None
            and "reading" not in piece
            and "reading" not in last
            and last.get("highlight") == piece.get("highlight")
        ):
            last["text"] += piece["text"]
        else:
            tidied.append(piece)
    return tidied


def sentence_plain(value: str) -> str:
    """The Sentence field as plain text, keeping its line breaks."""
    value = re.sub(r"<br\s*/?>", "\n", value)
    value = re.sub(r"</?b>", "", value)
    if "<" in value:
        raise BuildError("unexpected markup in sentence")
    return html.unescape(value).replace("\xa0", " ").strip()


def parse_sentence(fields: dict[str, str]) -> dict | None:
    if not fields["Sentence"].strip():
        return None
    # The furigana field is the source: it's what carries the readings. The
    # Sentence field is only compared against it.
    furigana = fields["Sentence Furigana"].strip() or fields["Sentence"].strip()
    translation = to_text(fields["Sentence Meaning"])
    if not translation:
        raise BuildError("sentence has no translation")

    parser = _SentenceParser()
    parser.feed(furigana)
    parser.close()
    if parser.bold:
        raise BuildError("unclosed <b> in sentence")
    segments = _tidy_segments(parser.segments)
    return {
        "text": "".join(segment["text"] for segment in segments),
        "segments": segments,
        "translation": translation,
    }


# --- Building -----------------------------------------------------------------


def apply_repairs(fields: dict[str, str], used: set) -> None:
    for key, fixed in REPAIRS.items():
        word, field, broken = key
        if fields["Word"] == word and broken in fields[field]:
            fields[field] = fields[field].replace(broken, fixed)
            used.add(key)


def build_word(guid: str, position: int, fields: dict[str, str]) -> dict:
    meaning = to_text(fields["Word Meaning"])
    if not meaning:
        raise BuildError("no meaning")
    patterns = parse_pitch_accent(fields["Pitch Accent"])
    pitch_notes = pitch_notes_to_text(fields["Pitch Accent Notes"]) or None
    return {
        "id": guid,
        "position": position,
        "word": to_text(fields["Word"]),
        "reading": to_text(fields["Word Reading"]),
        "meaning": meaning,
        "notes": to_text(fields["Notes"]) or None,
        "pitchAccent": {"patterns": patterns, "notes": pitch_notes} if patterns else None,
        "sentence": parse_sentence(fields),
    }


_LEFTOVER_MARKUP = re.compile(r"<|>|&[#\w]+;|\[sound:|\[[^\]]*\]")


def check_no_markup(value, where: str) -> None:
    if isinstance(value, str):
        if _LEFTOVER_MARKUP.search(value):
            raise BuildError(f"markup left over in {where}: {value!r}")
    elif isinstance(value, dict):
        for key, item in value.items():
            check_no_markup(item, f"{where}.{key}")
    elif isinstance(value, list):
        for index, item in enumerate(value):
            check_no_markup(item, f"{where}[{index}]")


def build(notes: list[tuple[str, dict[str, str]]]) -> tuple[list[dict], list[str]]:
    """The words, and warnings worth a look that don't stop the build."""
    words: list[dict] = []
    warnings: list[str] = []
    errors: list[str] = []
    seen: set[str] = set()
    used_repairs: set = set()
    for guid, fields in notes:
        # The deck opens with a "Welcome to Kaishi" info card that has no reading.
        if not fields["Word Reading"].strip():
            continue
        apply_repairs(fields, used_repairs)
        label = f"{fields['Word']} (position {len(words) + 1})"
        try:
            if guid in seen:
                raise BuildError("id appears twice")
            seen.add(guid)
            word = build_word(guid, len(words) + 1, fields)
            # Anki guids are random printable characters, so only the
            # content is checked.
            check_no_markup({k: v for k, v in word.items() if k != "id"}, "word")
        except BuildError as error:
            errors.append(f"{label}: {error}")
            continue
        words.append(word)

        sentence = word["sentence"]
        if sentence and sentence["text"] != sentence_plain(fields["Sentence"]):
            warnings.append(
                f"{label}: furigana text {sentence['text']!r} differs from "
                f"Sentence {sentence_plain(fields['Sentence'])!r}"
            )
        if sentence and not any(s.get("highlight") for s in sentence["segments"]):
            warnings.append(f"{label}: the sentence doesn't mark the word")
        for pattern in (word["pitchAccent"] or {}).get("patterns", []):
            if not is_regular_pitch(pattern["pitch"]):
                warnings.append(
                    f"{label}: unusual pitch {pattern['kana']} {pattern['pitch']} (as drawn)"
                )
    for key in REPAIRS.keys() - used_repairs:
        errors.append(f"repair no longer applies: {key[0]} {key[1]}")
    if errors:
        raise BuildError("\n".join(errors))
    return words, warnings


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    apkg = Path(sys.argv[1]).expanduser()

    with tempfile.TemporaryDirectory() as workdir:
        db = open_collection(apkg, Path(workdir))
        try:
            notes = read_notes(db)
        finally:
            db.close()

    try:
        words, warnings = build(notes)
    except BuildError as error:
        sys.exit(f"Build failed:\n{error}")

    # One word per line: small to bundle, and a deck update diffs by word.
    lines = (json.dumps(word, ensure_ascii=False, separators=(",", ":")) for word in words)
    OUTPUT.write_text("[\n" + ",\n".join(lines) + "\n]\n", encoding="utf-8")

    no_sentence = [word["word"] for word in words if word["sentence"] is None]
    no_pitch = [word["word"] for word in words if word["pitchAccent"] is None]
    print(f"Wrote {len(words)} words to data/words.json")
    print(f"No sentence ({len(no_sentence)}): {', '.join(no_sentence) or 'none'}")
    print(f"No pitch accent ({len(no_pitch)}): {', '.join(no_pitch) or 'none'}")
    if warnings:
        print(f"\nWorth a look ({len(warnings)}):")
        for warning in warnings:
            print(f"  {warning}")


if __name__ == "__main__":
    main()
