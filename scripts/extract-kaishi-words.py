"""
Extract the word list (word + reading, in deck order) from a Kaishi 1.5k .apkg.

Only the word and its kana reading are extracted. Meanings, example sentences,
audio and pictures are deliberately left out: the deck has no license, and its
sentences and translations come from the Core and Tango decks. See the
licensing notes in README.md.

Usage:
    python3 -I scripts/extract-kaishi-words.py <path/to/Kaishi.apkg> <output.json>

Requires Python 3.14+ (for compression.zstd, used to read modern .apkg files).
"""

import json
import sqlite3
import sys
import tempfile
import zipfile
from compression import zstd
from pathlib import Path

NOTETYPE_NAME = "Kaishi 1.5k"
FIELD_SEPARATOR = "\x1f"


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


def extract(db: sqlite3.Connection) -> list[dict]:
    (notetype_id,) = db.execute(
        "select id from notetypes where name = ?", (NOTETYPE_NAME,)
    ).fetchone()
    field_names = [
        name
        for (name,) in db.execute(
            "select name from fields where ntid = ? order by ord", (notetype_id,)
        )
    ]
    word_index = field_names.index("Word")
    reading_index = field_names.index("Word Reading")

    # Every card is new, and a new card's `due` is its position in the deck's
    # learning queue — i.e. the order the deck intends words to be learned.
    rows = db.execute(
        """
        select n.guid, n.flds
        from cards c join notes n on n.id = c.nid
        where n.mid = ?
        order by c.due
        """,
        (notetype_id,),
    ).fetchall()

    words = []
    for guid, fields in rows:
        values = fields.split(FIELD_SEPARATOR)
        word = values[word_index].strip()
        reading = values[reading_index].strip()
        # The deck opens with a "Welcome to Kaishi" info card that has no reading.
        if not reading:
            continue
        words.append(
            {
                "position": len(words) + 1,
                # Anki's permanent note id: unique even when the same word
                # appears twice with different meanings (e.g. 高い tall/expensive).
                "guid": guid,
                "word": word,
                "reading": reading,
            }
        )
    return words


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    apkg, output = Path(sys.argv[1]), Path(sys.argv[2])

    with tempfile.TemporaryDirectory() as workdir:
        db = open_collection(apkg, Path(workdir))
        try:
            words = extract(db)
        finally:
            db.close()

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(words, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Wrote {len(words)} words to {output}")


if __name__ == "__main__":
    main()
