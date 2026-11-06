"""
Browse and search the full Kaishi 1.5k deck in a local web page.

For studying the deck while building Doshi, not part of the app. It reads a
local copy of the .apkg into memory and serves it on 127.0.0.1 only. Nothing
is written to disk or to the repo. The deck has no license (see the licensing
notes in README.md), so keep it that way: never copy what it shows into the
app, the repo or a build.

Usage:
    python3 -I scripts/kaishi-browser.py <path/to/Kaishi.apkg> [--port 8642] [--no-open]

If data/source/kaishi-meanings.json exists, each card also shows the JMdict
meaning Doshi uses for that word, for comparison.

Requires Python 3.14+ (for compression.zstd, used to read modern .apkg files).
"""

import argparse
import json
import mimetypes
import sqlite3
import tempfile
import threading
import webbrowser
import zipfile
from compression import zstd
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

NOTETYPE_NAME = "Kaishi 1.5k"
FIELD_SEPARATOR = "\x1f"
ZSTD_MAGIC = b"\x28\xb5\x2f\xfd"
MEANINGS = Path(__file__).resolve().parent.parent / "data/source/kaishi-meanings.json"


# --- Reading the deck -------------------------------------------------------


def _unicase(a: str, b: str) -> int:
    a, b = a.casefold(), b.casefold()
    return (a > b) - (a < b)


def read_notes(archive: zipfile.ZipFile) -> list[dict]:
    # Modern .apkg files keep the real collection in a zstd-compressed
    # `collection.anki21b`; `collection.anki2` is a placeholder for old Anki.
    with tempfile.TemporaryDirectory() as workdir:
        database = Path(workdir) / "collection.sqlite"
        database.write_bytes(zstd.decompress(archive.read("collection.anki21b")))
        db = sqlite3.connect(database)
        try:
            db.create_collation("unicase", _unicase)
            (notetype_id,) = db.execute(
                "select id from notetypes where name = ?", (NOTETYPE_NAME,)
            ).fetchone()
            names = [
                name
                for (name,) in db.execute(
                    "select name from fields where ntid = ? order by ord",
                    (notetype_id,),
                )
            ]
            # A new card's `due` is its place in the deck's learning order.
            rows = db.execute(
                """
                select n.guid, n.flds from cards c join notes n on n.id = c.nid
                where n.mid = ? order by c.due
                """,
                (notetype_id,),
            ).fetchall()
        finally:
            db.close()

    notes = []
    for guid, fields in rows:
        note = dict(zip(names, fields.split(FIELD_SEPARATOR)))
        # The deck opens with a "Welcome to Kaishi" info card with no reading.
        if not note.get("Word Reading", "").strip():
            continue
        notes.append({"position": len(notes) + 1, "guid": guid, "fields": note})
    return notes


def _varint(data: bytes, at: int) -> tuple[int, int]:
    value = shift = 0
    while True:
        byte = data[at]
        at += 1
        value |= (byte & 0x7F) << shift
        if byte < 0x80:
            return value, at
        shift += 7


def _protobuf_fields(data: bytes):
    """Yield (field number, value) for a protobuf message's top-level fields."""
    at = 0
    while at < len(data):
        key, at = _varint(data, at)
        number, wire = key >> 3, key & 7
        if wire == 0:
            value, at = _varint(data, at)
        elif wire == 2:
            length, at = _varint(data, at)
            value, at = data[at : at + length], at + length
        elif wire == 1:
            value, at = data[at : at + 8], at + 8
        elif wire == 5:
            value, at = data[at : at + 4], at + 4
        else:
            raise ValueError(f"unsupported protobuf wire type {wire}")
        yield number, value


def read_media_index(archive: zipfile.ZipFile) -> dict[str, str]:
    """Map each media filename to its numbered member in the zip."""
    raw = archive.read("media")
    if raw.startswith(ZSTD_MAGIC):
        raw = zstd.decompress(raw)
    if raw.lstrip().startswith(b"{"):
        # Older .apkg: a JSON object of {"0": "name.mp3", ...}.
        return {name: member for member, name in json.loads(raw).items()}
    # Modern .apkg: MediaEntries { repeated MediaEntry entries = 1; } where
    # MediaEntry { string name = 1; uint32 size = 2; bytes sha1 = 3;
    # optional uint32 legacy_zip_filename = 4; }. Without field 4 the member
    # is named after the entry's index.
    index = {}
    entries = [value for number, value in _protobuf_fields(raw) if number == 1]
    for position, entry in enumerate(entries):
        fields = dict(_protobuf_fields(entry))
        name = fields[1].decode("utf-8")
        index[name] = str(fields.get(4, position))
    return index


def read_meanings() -> dict[str, str]:
    if not MEANINGS.exists():
        return {}
    return {
        entry["guid"]: entry["meaning"]
        for entry in json.loads(MEANINGS.read_text(encoding="utf-8"))
    }


# --- Serving ----------------------------------------------------------------


class Deck:
    def __init__(self, apkg: Path):
        self.archive = zipfile.ZipFile(apkg)
        self.media = read_media_index(self.archive)
        meanings = read_meanings()
        notes = read_notes(self.archive)
        for note in notes:
            note["doshiMeaning"] = meanings.get(note["guid"])
        self.notes_json = json.dumps(notes, ensure_ascii=False).encode("utf-8")
        self.count = len(notes)
        self.lock = threading.Lock()

    def media_file(self, name: str) -> bytes | None:
        member = self.media.get(name)
        if member is None:
            return None
        with self.lock:
            data = self.archive.read(member)
        return zstd.decompress(data) if data.startswith(ZSTD_MAGIC) else data


def make_handler(deck: Deck):
    page = PAGE.encode("utf-8")

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            path = urlparse(self.path).path
            if path == "/":
                self.send(page, "text/html; charset=utf-8")
            elif path == "/notes.json":
                self.send(deck.notes_json, "application/json; charset=utf-8")
            elif path.startswith("/media/"):
                name = unquote(path.removeprefix("/media/"))
                data = deck.media_file(name)
                if data is None:
                    self.send_error(HTTPStatus.NOT_FOUND)
                    return
                kind = mimetypes.guess_type(name)[0] or "application/octet-stream"
                self.send(data, kind, cache=True)
            else:
                self.send_error(HTTPStatus.NOT_FOUND)

        def send(self, body: bytes, kind: str, cache: bool = False):
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", kind)
            self.send_header("Content-Length", str(len(body)))
            if cache:
                self.send_header("Cache-Control", "max-age=86400")
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, format, *args):
            pass

    return Handler


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Browse the Kaishi 1.5k deck locally."
    )
    parser.add_argument("apkg", type=Path, help="path to the Kaishi .apkg")
    parser.add_argument("--port", type=int, default=8642)
    parser.add_argument(
        "--no-open", action="store_true", help="don't open a browser tab"
    )
    args = parser.parse_args()

    deck = Deck(args.apkg)
    # Loopback only: the deck must not be served to other machines.
    server = ThreadingHTTPServer(("127.0.0.1", args.port), make_handler(deck))
    url = f"http://127.0.0.1:{args.port}/"
    print(f"Serving {deck.count} Kaishi cards at {url} (Ctrl+C to stop)")
    if not args.no_open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


PAGE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kaishi Browser</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #fafafa; --surface: #ffffff; --border: #e4e4e7; --text: #18181b;
    --muted: #52525b; --subtle: #a1a1aa; --accent: #e11d48; --accent-soft: #fff1f2;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #09090b; --surface: #18181b; --border: #27272a; --text: #fafafa;
      --muted: #a1a1aa; --subtle: #71717a; --accent: #fb7185; --accent-soft: #2a0e16;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font: 15px/1.5 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif;
  }
  header {
    position: sticky; top: 0; z-index: 1; background: var(--bg);
    border-bottom: 1px solid var(--border); padding: 16px;
  }
  .bar { max-width: 960px; margin: 0 auto; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  h1 { font-size: 16px; margin: 0 12px 0 0; }
  input[type=search], select {
    font: inherit; color: inherit; background: var(--surface);
    border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px;
  }
  input[type=search] { flex: 1 1 260px; min-width: 0; }
  .count { color: var(--muted); font-size: 13px; }
  main { max-width: 960px; margin: 0 auto; padding: 16px; }
  .row {
    display: grid; grid-template-columns: 48px minmax(80px, 160px) 1fr; gap: 12px; align-items: baseline;
    width: 100%; text-align: left; font: inherit; color: inherit; cursor: pointer;
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 14px; margin-bottom: 6px;
  }
  .row:hover { border-color: var(--subtle); }
  .row[aria-expanded=true] { border-color: var(--accent); }
  .pos { color: var(--subtle); font-variant-numeric: tabular-nums; font-size: 13px; }
  .word { font-size: 20px; }
  .word small { display: block; font-size: 12px; color: var(--muted); }
  .gloss { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .detail {
    background: var(--surface); border: 1px solid var(--accent); border-top: 0;
    border-radius: 0 0 10px 10px; margin: -12px 0 10px; padding: 20px;
    display: grid; grid-template-columns: 1fr auto; gap: 16px;
  }
  .detail .big { font-size: 40px; line-height: 1.6; }
  .detail h3 { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--subtle); margin: 14px 0 4px; }
  .detail h3:first-child { margin-top: 0; }
  .sentence { font-size: 22px; line-height: 2; }
  .sentence b, .big b { color: var(--accent); font-weight: inherit; }
  rt { font-size: .5em; color: var(--muted); }
  .muted { color: var(--muted); }
  .picture img { max-width: 180px; max-height: 180px; border-radius: 8px; background: #fff; }
  .play {
    font: inherit; font-size: 13px; color: var(--accent); background: var(--accent-soft);
    border: 0; border-radius: 999px; padding: 4px 12px; cursor: pointer; margin-right: 6px;
  }
  .compare { border-left: 3px solid var(--border); padding-left: 10px; }
  .more { display: block; margin: 16px auto; }
  footer { max-width: 960px; margin: 0 auto; padding: 16px 16px 40px; color: var(--subtle); font-size: 12px; }
  footer a { color: inherit; }
  @media (max-width: 640px) {
    .row { grid-template-columns: 36px 1fr; }
    .gloss { grid-column: 2; white-space: normal; }
    .detail { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<header>
  <div class="bar">
    <h1>Kaishi 1.5k</h1>
    <input id="q" type="search" placeholder="Search in kana, kanji, romaji or English… ( / )" autofocus>
    <select id="scope" aria-label="Search in">
      <option value="all">Everything</option>
      <option value="word">Word + reading</option>
      <option value="meaning">Meaning</option>
      <option value="sentence">Sentence</option>
      <option value="notes">Notes</option>
    </select>
    <span class="count" id="count"></span>
  </div>
</header>
<main id="list"></main>
<footer>
  Local study copy of <a href="https://github.com/donkuri/Kaishi" target="_blank" rel="noreferrer">Kaishi 1.5k</a>
  by donkuri (sentences from the Core and Tango decks, pictures from Irasutoya).
  The deck has no license: don't copy its meanings, sentences, audio or pictures into Doshi.
</footer>
<script>
const PAGE_SIZE = 150;
let notes = [], results = [], shown = PAGE_SIZE, open = null;

const $ = (id) => document.getElementById(id);
const toHiragana = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const plain = (html) => { const d = document.createElement("div"); d.innerHTML = html.replace(/<br\s*\/?>/gi, " "); return d.textContent; };
const norm = (s) => toHiragana(s.normalize("NFKC").toLowerCase());

// Romaji → hiragana, so "taberu", "tabemono" or "toukyou" find 食べる, 食べ物, 東京.
// Hepburn, Kunrei and wapuro spellings all work; macrons expand (ō → ou).
const KANA = (() => {
  const t = {};
  const rows = { "": "あいうえお", k: "かきくけこ", s: "さしすせそ", t: "たちつてと", n: "なにぬねの",
    h: "はひふへほ", m: "まみむめも", y: "や_ゆ_よ", r: "らりるれろ", w: "わ__を_", g: "がぎぐげご",
    z: "ざじずぜぞ", d: "だぢづでど", b: "ばびぶべぼ", p: "ぱぴぷぺぽ" };
  for (const [c, kana] of Object.entries(rows)) [..."aiueo"].forEach((v, i) => { if (kana[i] !== "_") t[c + v] = kana[i]; });
  Object.assign(t, { shi: "し", chi: "ち", tsu: "つ", fu: "ふ", ji: "じ", si: "し", ti: "ち", tu: "つ",
    hu: "ふ", zi: "じ", di: "ぢ", du: "づ", wo: "を", xa: "ぁ", xi: "ぃ", xu: "ぅ", xe: "ぇ", xo: "ぉ", xtsu: "っ", xtu: "っ",
    fa: "ふぁ", fi: "ふぃ", fe: "ふぇ", fo: "ふぉ", va: "ゔぁ", vi: "ゔぃ", vu: "ゔ", ve: "ゔぇ", vo: "ゔぉ",
    "n'": "ん", "-": "ー" });
  const small = { a: "ゃ", u: "ゅ", o: "ょ" };
  for (const [c, i] of Object.entries({ k: "き", s: "し", t: "ち", n: "に", h: "ひ", m: "み", r: "り",
    g: "ぎ", z: "じ", j: "じ", d: "ぢ", b: "び", p: "ぴ", c: "ち" }))
    for (const [v, y] of Object.entries(small)) t[c + "y" + v] = i + y;
  for (const [v, y] of Object.entries(small)) { t["sh" + v] = "し" + y; t["ch" + v] = "ち" + y; t["j" + v] = "じ" + y; }
  t.je = "じぇ"; t.she = "しぇ"; t.che = "ちぇ";
  return t;
})();

/** Every kana reading a romaji term could mean while it's still being typed. */
function romajiToKana(term) {
  const text = term.replace(/[āâ]/g, "aa").replace(/[īî]/g, "ii").replace(/[ūû]/g, "uu")
    .replace(/[ēê]/g, "ei").replace(/[ōô]/g, "ou");
  // No "l" or "q" in romaji, so English words like "hello" stay English.
  if (!/^[a-km-pr-z'-]+$/.test(text)) return [];
  let out = "", i = 0;
  while (i < text.length) {
    const c = text[i], next = text[i + 1];
    // Doubled consonant (kk, tt, tch) → small tsu.
    if (next && c === next && !"aiueon'-".includes(c)) { out += "っ"; i += 1; continue; }
    if (c === "t" && next === "c") { out += "っ"; i += 1; continue; }
    // "nn" → ん; before a vowel the second n starts the next syllable (konnichiha).
    if (c === "n" && next === "n") { out += "ん"; i += "aiueoy".includes(text[i + 2] ?? "") ? 1 : 2; continue; }
    // n before a consonant (not y) → ん.
    if (c === "n" && next && !"aiueoy'n".includes(next)) { out += "ん"; i += 1; continue; }
    const match = [4, 3, 2, 1].map((len) => text.slice(i, i + len)).find((chunk) => KANA[chunk]);
    if (!match) break;
    out += KANA[match];
    i += match.length;
  }
  const rest = text.slice(i);
  // Fully converted, or a trailing "n" that is ん now but may become な-row.
  if (!rest) return [out];
  if (rest === "n") return [out + "ん", out];
  // A half-typed syllable ("tab"): match on what's converted so far.
  return /^[a-z]{1,3}$/.test(rest) && out ? [out] : [];
}

// Deck HTML is kept to a few formatting tags; everything else is unwrapped.
const ALLOWED = new Set(["B", "I", "U", "BR", "SPAN", "DIV", "STRONG", "EM", "SUB", "SUP", "RUBY", "RT"]);
function sanitize(html) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild;
  for (const el of [...root.querySelectorAll("*")]) {
    if (["SCRIPT", "STYLE", "IMG", "IFRAME", "OBJECT"].includes(el.tagName)) { el.remove(); continue; }
    if (!ALLOWED.has(el.tagName)) { el.replaceWith(...el.childNodes); continue; }
    for (const attr of [...el.attributes]) {
      if (!(attr.name === "style" && el.tagName === "SPAN")) el.removeAttribute(attr.name);
    }
  }
  return root;
}

// Anki furigana: "漢字[かんじ]", the base running back to the previous space.
function furigana(html) {
  const root = sanitize(html);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  for (const node of texts) {
    const text = node.nodeValue;
    if (!text.includes("[")) continue;
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of text.matchAll(/ ?([^ \[\]]+)\[([^\]]*)\]/g)) {
      frag.append(text.slice(last, m.index));
      const ruby = document.createElement("ruby");
      ruby.append(m[1]);
      const rt = document.createElement("rt");
      rt.textContent = m[2];
      ruby.append(rt);
      frag.append(ruby);
      last = m.index + m[0].length;
    }
    frag.append(text.slice(last));
    node.replaceWith(frag);
  }
  return root;
}

function sounds(field) {
  return [...(field || "").matchAll(/\[sound:([^\]]+)\]/g)].map((m) => m[1]);
}

function playButton(label, file) {
  const b = document.createElement("button");
  b.className = "play";
  b.textContent = "▶ " + label;
  b.onclick = (e) => { e.stopPropagation(); new Audio("/media/" + encodeURIComponent(file)).play(); };
  return b;
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.assign(e, attrs);
  e.append(...children.filter((c) => c != null));
  return e;
}

function index(note) {
  const f = note.fields;
  note.search = {
    word: norm(`${f["Word"]} ${f["Word Reading"]}`),
    meaning: norm(plain(f["Word Meaning"] || "")),
    sentence: norm(`${plain(f["Sentence"] || "")} ${plain(f["Sentence Furigana"] || "").replace(/[\[\]]/g, " ")} ${plain(f["Sentence Meaning"] || "")}`),
    notes: norm(plain(`${f["Notes"] || ""} ${f["Pitch Accent Notes"] || ""}`)),
  };
  note.search.all = Object.values(note.search).join(" ");
}

function search() {
  // Each term matches as typed (English, kana, kanji) or as romaji read as kana.
  const terms = norm($("q").value.trim()).split(/\s+/).filter(Boolean)
    .map((t) => [t, ...romajiToKana(t)]);
  const scope = $("scope").value;
  const num = /^\d+$/.test($("q").value.trim()) ? Number($("q").value.trim()) : null;
  results = notes.filter((n) => n.position === num || terms.every((alts) => alts.some((t) => n.search[scope].includes(t))));
  if (num != null) results.sort((a, b) => (b.position === num) - (a.position === num));
  shown = PAGE_SIZE;
  history.replaceState(null, "", "#" + new URLSearchParams({ q: $("q").value, s: scope }));
  render();
}

function detail(note) {
  const f = note.fields;
  const pictureSrc = (f["Picture"] || "").match(/src="([^"]+)"/);
  const audio = el("div", {},
    ...sounds(f["Word Audio"]).map((s) => playButton("Word", s)),
    ...sounds(f["Sentence Audio"]).map((s) => playButton("Sentence", s)));
  const left = el("div", {},
    el("div", { className: "big", lang: "ja" }, furigana(f["Word Furigana"] || f["Word"])),
    audio,
    el("h3", {}, "Meaning"), el("div", {}, sanitize(f["Word Meaning"] || "")),
    note.doshiMeaning ? el("div", { className: "muted compare" }, `Doshi (JMdict): ${note.doshiMeaning}`) : null,
    el("h3", {}, "Sentence"),
    el("div", { className: "sentence", lang: "ja" }, furigana(f["Sentence Furigana"] || f["Sentence"] || "")),
    el("div", { className: "muted" }, sanitize(f["Sentence Meaning"] || "")),
    f["Pitch Accent"] ? el("h3", {}, "Pitch accent") : null,
    f["Pitch Accent"] ? el("div", { lang: "ja" }, sanitize(f["Pitch Accent"])) : null,
    f["Pitch Accent Notes"] ? el("div", { className: "muted" }, sanitize(f["Pitch Accent Notes"])) : null,
    f["Notes"] ? el("h3", {}, "Notes") : null,
    f["Notes"] ? el("div", {}, sanitize(f["Notes"])) : null,
    el("h3", {}, "Deck"),
    el("div", { className: "muted" }, `#${note.position} · frequency rank ${f["Frequency"] || "—"}`));
  const right = pictureSrc
    ? el("div", { className: "picture" }, el("img", { src: "/media/" + encodeURIComponent(pictureSrc[1]), alt: "", loading: "lazy" }))
    : null;
  return el("div", { className: "detail" }, left, right);
}

function render() {
  const list = $("list");
  list.replaceChildren();
  $("count").textContent = `${results.length} of ${notes.length}`;
  for (const note of results.slice(0, shown)) {
    const f = note.fields;
    const row = el("button", { className: "row" },
      el("span", { className: "pos" }, String(note.position)),
      el("span", { className: "word", lang: "ja" }, f["Word"],
        f["Word Reading"] !== f["Word"] ? el("small", {}, f["Word Reading"]) : null),
      el("span", { className: "gloss" }, plain(f["Word Meaning"] || "")));
    row.setAttribute("aria-expanded", String(open === note.guid));
    row.onclick = () => { open = open === note.guid ? null : note.guid; render(); };
    list.append(row);
    if (open === note.guid) list.append(detail(note));
  }
  if (results.length > shown) {
    const more = el("button", { className: "play more" }, `Show ${Math.min(PAGE_SIZE, results.length - shown)} more`);
    more.onclick = () => { shown += PAGE_SIZE; render(); };
    list.append(more);
  }
}

let timer;
$("q").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(search, 80); });
$("scope").addEventListener("change", search);
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== $("q")) { e.preventDefault(); $("q").focus(); }
  if (e.key === "Escape") { open = null; render(); }
});

fetch("/notes.json").then((r) => r.json()).then((data) => {
  notes = data;
  notes.forEach(index);
  const params = new URLSearchParams(location.hash.slice(1));
  $("q").value = params.get("q") || "";
  $("scope").value = params.get("s") || "all";
  search();
});
</script>
</body>
</html>
"""


if __name__ == "__main__":
    main()
