#!/usr/bin/env python3
"""Scrape HSK 1-4 vocabulary from thanhmaihsk.edu.vn into data/v2/*.json"""
import json
import re
import ssl
import tempfile
import urllib.request
from pathlib import Path

URLS = {
    1: "https://thanhmaihsk.edu.vn/150-tu-vung-hsk-1/",
    2: "https://thanhmaihsk.edu.vn/tu-vung-tieng-trung-hsk2/",
    3: "https://thanhmaihsk.edu.vn/tu-vung-hsk3-co-vi-du/",
    4: "https://thanhmaihsk.edu.vn/tong-hop-tu-vung-hsk-4/",
}

HSK4_PDF = "https://thanhmaihsk.edu.vn/wp-content/uploads/2021/04/Tu-vung-HSK-4.pdf"

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

WORD_TYPES = {
    "danh từ",
    "động từ",
    "tính từ",
    "trạng từ",
    "phó từ",
    "liên từ",
    "từ nối",
    "lượng từ",
    "số từ",
    "đại từ",
    "trợ từ",
    "đơn vị đo",
    "từ chỉ thời gian",
    "từ cảm thán",
    "phó nối",
}


def strip_html(text: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"&nbsp;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def is_hanzi_word(s: str) -> bool:
    if not s or len(s) > 24:
        return False
    return bool(re.match(r"^[\u4e00-\u9fff｜|·\s…\.]+$", s)) and bool(
        re.search(r"[\u4e00-\u9fff]", s)
    )


def is_pinyin_line(s: str) -> bool:
    s = s.strip().lower()
    if not s or len(s) > 40:
        return False
    if re.search(r"[\u4e00-\u9fff]", s):
        return False
    return bool(re.match(r"^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\s'\.\-…0-9]+$", s, re.I))


def is_word_type(s: str) -> bool:
    low = s.strip().lower()
    if low in WORD_TYPES:
        return True
    return any(low.startswith(t) for t in WORD_TYPES)


def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120, context=CTX) as resp:
        return resp.read()


def fetch_html(url: str) -> str:
    return fetch_bytes(url).decode("utf-8", errors="replace")


def parse_vocab_table(html: str) -> list[dict]:
    entries = []
    seen = set()
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.DOTALL | re.I)
    for row in rows:
        cells = [
            strip_html(c)
            for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, re.DOTALL | re.I)
        ]
        if len(cells) < 4:
            continue
        hanzi = cells[0].replace("｜", "|")
        if not is_hanzi_word(hanzi) or hanzi in seen:
            continue
        seen.add(hanzi)
        entries.append(
            {
                "id": len(entries) + 1,
                "hanzi": hanzi,
                "pinyin": cells[1] if len(cells) > 1 else "",
                "type": cells[2] if len(cells) > 2 else "",
                "meaning": cells[3] if len(cells) > 3 else "",
                "example": cells[4] if len(cells) > 4 else "",
                "examplePy": cells[5] if len(cells) > 5 else "",
                "exampleVi": cells[6] if len(cells) > 6 else "",
            }
        )
    return entries


def merge_example_fields(target: dict, source: dict) -> bool:
    """Copy example fields from source into target if source has an example sentence."""
    ex = (source.get("example") or "").strip()
    if not ex:
        return False
    target["example"] = ex
    py = (source.get("examplePy") or "").strip()
    if py:
        target["examplePy"] = py
    vi = (source.get("exampleVi") or "").strip()
    if vi:
        target["exampleVi"] = vi
    return True


def merge_examples_by_hanzi(
    base: list[dict], sources: list[list[dict]], *, only_missing: bool = False
) -> int:
    """Merge example / examplePy / exampleVi from sources into base entries by hanzi."""
    lookup: dict[str, dict] = {}
    for src_list in sources:
        for item in src_list:
            ex = (item.get("example") or "").strip()
            if ex:
                lookup[item["hanzi"]] = item

    merged = 0
    for entry in base:
        if only_missing and (entry.get("example") or "").strip():
            continue
        src = lookup.get(entry["hanzi"])
        if src and merge_example_fields(entry, src):
            merged += 1
    return merged


def fill_example_pinyin(entries: list[dict]) -> int:
    """Generate examplePy with pypinyin when example exists but pinyin is missing."""
    try:
        from pypinyin import Style, lazy_pinyin
    except ImportError:
        return 0

    filled = 0
    for entry in entries:
        ex = (entry.get("example") or "").strip()
        if not ex or (entry.get("examplePy") or "").strip():
            continue
        py = " ".join(lazy_pinyin(ex, style=Style.TONE))
        entry["examplePy"] = py
        filled += 1
    return filled


def load_v3_supplement(level: int) -> list[dict]:
    v3_path = Path(__file__).resolve().parent.parent / "data" / f"hsk{level}.json"
    if level == 2:
        alt = Path(__file__).resolve().parent.parent / "data" / "hsk-lv2.json"
        if alt.exists():
            v3_path = alt
    if not v3_path.exists():
        return []
    with open(v3_path, encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def renumber(entries: list[dict]) -> None:
    for i, entry in enumerate(entries, start=1):
        entry["id"] = i


def parse_hsk4_pdf(pdf_bytes: bytes) -> list[dict]:
    import fitz

    entries = []
    seen = set()
    skip_prefixes = (
        "từ vựng",
        "website",
        "fanpage",
        "tiktok",
        "tiếng trung",
        "phiên âm",
        "danh sách",
        "wevsite",
    )

    for page in fitz.open(stream=pdf_bytes, filetype="pdf"):
        lines = [ln.strip() for ln in page.get_text().splitlines() if ln.strip()]
        i = 0
        while i < len(lines):
            line = lines[i]
            low = line.lower()
            if any(low.startswith(p) for p in skip_prefixes):
                i += 1
                continue
            if not is_hanzi_word(line) or line in seen:
                i += 1
                continue
            if i + 2 >= len(lines):
                break
            pinyin = lines[i + 1]
            wtype = lines[i + 2]
            if not is_pinyin_line(pinyin):
                i += 1
                continue
            if not is_word_type(wtype):
                i += 1
                continue
            meanings = []
            j = i + 3
            while j < len(lines):
                nxt = lines[j]
                if is_hanzi_word(nxt):
                    break
                if is_pinyin_line(nxt):
                    break
                if is_word_type(nxt):
                    break
                if any(nxt.lower().startswith(p) for p in skip_prefixes):
                    break
                meanings.append(nxt)
                j += 1
            if not meanings:
                i += 1
                continue
            seen.add(line)
            entries.append(
                {
                    "id": len(entries) + 1,
                    "hanzi": line,
                    "pinyin": pinyin,
                    "type": wtype,
                    "meaning": "; ".join(meanings),
                    "example": "",
                    "examplePy": "",
                    "exampleVi": "",
                }
            )
            i = j

    return entries


def main():
    out_dir = Path(__file__).resolve().parent.parent / "data" / "v2"
    out_dir.mkdir(parents=True, exist_ok=True)

    for level, url in URLS.items():
        print(f"Fetching HSK {level} HTML...")
        html = fetch_html(url)
        entries = parse_vocab_table(html)

        if level == 4:
            print("  Fetching HSK 4 PDF for full list...")
            try:
                pdf_entries = parse_hsk4_pdf(fetch_bytes(HSK4_PDF))
                if len(pdf_entries) > len(entries):
                    base_hanzi = {e["hanzi"] for e in pdf_entries}
                    entries = pdf_entries
                    for html_row in parse_vocab_table(html):
                        if html_row["hanzi"] not in base_hanzi and (html_row.get("example") or "").strip():
                            entries.append(html_row)
                            base_hanzi.add(html_row["hanzi"])
                    print(f"  Using PDF + HTML-only rows ({len(entries)} words)")
            except Exception as exc:
                print(f"  PDF parse failed: {exc}")

        if level == 4:
            html_rows = parse_vocab_table(html)
            merged_html = merge_examples_by_hanzi(entries, [html_rows])
            merged_v3 = merge_examples_by_hanzi(
                entries, [load_v3_supplement(4)], only_missing=True
            )
            filled_py = fill_example_pinyin(entries)
            ex_count = sum(1 for e in entries if (e.get("example") or "").strip())
            py_count = sum(1 for e in entries if (e.get("examplePy") or "").strip())
            print(
                f"  Examples: {ex_count} words, pinyin ví dụ: {py_count}"
                f" (HTML {merged_html}, v3 fallback {merged_v3}, pinyin gen {filled_py})"
            )
        renumber(entries)

        out_path = out_dir / f"hsk{level}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=0)
        print(f"  Wrote {out_path} ({len(entries)} words)")


if __name__ == "__main__":
    main()
