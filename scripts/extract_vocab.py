#!/usr/bin/env python3
"""Extract HSK vocabulary from PDF files into JSON."""
import fitz
import re
import json
import sys
from pathlib import Path

WORD_TYPES = (
    "danh từ",
    "động từ",
    "tính từ",
    "số từ",
    "lượng từ",
    "trợ từ",
    "liên từ",
    "phó từ",
    "tiền tố",
    "đại từ",
)


def is_hanzi_line(s):
    return bool(re.search(r"[\u4e00-\u9fff]", s)) and len(
        re.findall(r"[\u4e00-\u9fff]", s)
    ) >= max(1, len(s) * 0.3)


def is_pinyin_line(s):
    return bool(
        re.match(
            r"^[a-zA-ZāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüÜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛ\s,·/\-•｜|0-9]+$"
            ,
            s,
        )
    )


def page_table_rows(page, y_tol=8):
    items = []
    d = page.get_text("dict")
    for block in d.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                t = span["text"].strip()
                if not t:
                    continue
                y0, x0 = span["bbox"][1], span["bbox"][0]
                items.append((y0, x0, t))
    if not items:
        return []
    items.sort(key=lambda z: (z[0], z[1]))
    rows = []
    cur_y = None
    cur = []
    for y, x, t in items:
        if cur_y is None or abs(y - cur_y) <= y_tol:
            cur.append((x, t))
            cur_y = y if cur_y is None else (cur_y + y) / 2
        else:
            cur.sort(key=lambda z: z[0])
            rows.append([t for x, t in cur])
            cur = [(x, t)]
            cur_y = y
    if cur:
        cur.sort(key=lambda z: z[0])
        rows.append([t for x, t in cur])
    return rows


def find_type_index(cells):
    for i, c in enumerate(cells):
        low = c.lower()
        for wt in WORD_TYPES:
            if low == wt or low.startswith(wt + " ") or low.startswith(wt + ","):
                return i
    return -1


def merge_hanzi(parts):
    out = []
    for p in parts:
        p = p.replace("｜", "|")
        if is_hanzi_line(p) or p in ("|", "｜"):
            out.append(p)
    return "".join(out) if out else (parts[0] if parts else "")


def merge_pinyin(parts):
    bits = []
    for p in parts:
        p = p.strip()
        if not p or p in ("|", "｜"):
            continue
        if is_pinyin_line(p):
            bits.append(p)
    return " | ".join(bits) if bits else ""


def parse_hsk_table_pdf(path):
    """HSK 1 & 2 — CHUẨN FORMAT HSK3.0 (table layout)."""
    doc = fitz.open(path)
    entries = []
    last = None

    for page in doc:
        for row in page_table_rows(page):
            if not row:
                continue
            head = row[0].lower()
            if "hsk" in head or head in ("stt", "từ", "tiếng trung", "pinyin"):
                continue
            if head in ("từ loại", "dịch nghĩa", "loại từ", "dịch nghĩa"):
                continue

            if re.match(r"^\d+$", row[0]):
                cells = row[1:]
                type_idx = find_type_index(cells)

                if type_idx >= 0:
                    before = cells[:type_idx]
                    wtype = cells[type_idx]
                    meaning_parts = cells[type_idx + 1 :]
                else:
                    before = cells[:-1] if len(cells) > 1 else cells
                    wtype = ""
                    meaning_parts = cells[-1:] if cells else []

                hanzi_parts = [c for c in before if is_hanzi_line(c) or c in ("|", "｜")]
                py_parts = [c for c in before if c not in hanzi_parts]

                hanzi = merge_hanzi(hanzi_parts if hanzi_parts else before[:1])
                pinyin = merge_pinyin(py_parts if py_parts else before[1:])
                meaning = " ".join(meaning_parts).strip()

                if not hanzi or not re.search(r"[\u4e00-\u9fff]", hanzi):
                    continue

                last = {
                    "id": int(row[0]),
                    "hanzi": hanzi,
                    "pinyin": pinyin or "",
                    "type": wtype,
                    "meaning": meaning,
                    "example": "",
                    "examplePy": "",
                    "exampleVi": "",
                }
                entries.append(last)
                continue

            if last:
                if find_type_index(row) >= 0:
                    tidx = find_type_index(row)
                    extra_type = row[tidx]
                    extra_meaning = " ".join(row[tidx + 1 :])
                    last["type"] = f"{last['type']}; {extra_type}".strip("; ")
                    last["meaning"] = f"{last['meaning']}; {extra_meaning}".strip("; ")
                else:
                    last["meaning"] = f"{last['meaning']}; {' '.join(row)}".strip("; ")

    doc.close()
    entries.sort(key=lambda e: e["id"])
    return entries


def parse_hsk4(path):
    doc = fitz.open(path)
    lines = [b.strip() for p in doc for b in p.get_text().split("\n") if b.strip()]
    doc.close()
    start = next(
        i
        for i, l in enumerate(lines)
        if l == "1" and re.search(r"[\u4e00-\u9fff]", lines[i + 1])
    )
    entries = []
    i = start
    while i < len(lines):
        if not re.match(r"^\d+$", lines[i]):
            i += 1
            continue
        num = int(lines[i])
        if i + 6 >= len(lines):
            break
        hanzi, pinyin, wtype, meaning, ex_zh, ex_vi = lines[i + 1 : i + 7]
        if re.search(r"[\u4e00-\u9fff]", hanzi):
            entries.append(
                {
                    "id": num,
                    "hanzi": hanzi,
                    "pinyin": pinyin,
                    "type": wtype,
                    "meaning": meaning,
                    "example": ex_zh,
                    "exampleVi": ex_vi,
                    "examplePy": "",
                }
            )
        i += 7
    return entries


def parse_hsk3(path):
    doc = fitz.open(path)
    lines = [b.strip() for p in doc for b in p.get_text().split("\n") if b.strip()]
    doc.close()
    start = next(
        (i for i, l in enumerate(lines) if l == "1" and lines[i + 1] == "爱心"),
        0,
    )

    entries = []
    i = start
    n = len(lines)

    while i < n:
        if not re.match(r"^\d+$", lines[i]):
            i += 1
            continue
        num = int(lines[i])
        i += 1
        if i >= n:
            break
        hanzi = lines[i]
        i += 1
        if i >= n:
            break
        pinyin = lines[i]
        i += 1

        wtype_parts = []
        while i < n:
            wtype_parts.append(lines[i])
            combined = "".join(wtype_parts)
            if "）" in combined or (
                ")" in combined and combined.count("(") <= combined.count(")")
            ):
                i += 1
                break
            if not (
                "（" in combined
                or "(" in combined
                or "," in combined
                or "名" in combined
                or "动" in combined
            ):
                break
            i += 1
        wtype = " ".join(wtype_parts).replace(" ,", ",")

        meaning_parts = []
        while i < n:
            if re.match(r"^\d+$", lines[i]) and i + 2 < n and is_pinyin_line(lines[i + 2]):
                break
            if is_hanzi_line(lines[i]) and not (
                "（" in lines[i] or lines[i].endswith(")")
            ):
                break
            meaning_parts.append(lines[i])
            i += 1
        meaning = " ".join(meaning_parts).replace(" ,", ",").strip()

        ex_zh_parts = []
        while i < n:
            if re.match(r"^\d+$", lines[i]) and i + 2 < n and is_pinyin_line(lines[i + 2]):
                break
            if not is_hanzi_line(lines[i]):
                break
            ex_zh_parts.append(lines[i])
            i += 1
        example = "".join(ex_zh_parts)

        ex_py_parts = []
        while i < n:
            if re.match(r"^\d+$", lines[i]) and i + 2 < n and is_pinyin_line(lines[i + 2]):
                break
            if is_hanzi_line(lines[i]):
                break
            if lines[i][0].isupper() or is_pinyin_line(lines[i]) or re.search(
                r"[a-zāáǎà]", lines[i]
            ):
                ex_py_parts.append(lines[i])
                i += 1
                if ex_py_parts and ex_py_parts[-1].endswith("."):
                    break
                continue
            break
        example_py = " ".join(ex_py_parts)

        ex_vi_parts = []
        while i < n:
            if (
                re.match(r"^\d+$", lines[i])
                and i + 1 < n
                and re.search(r"[\u4e00-\u9fff]", lines[i + 1])
                and i + 2 < n
                and is_pinyin_line(lines[i + 2])
            ):
                break
            if is_hanzi_line(lines[i]):
                break
            ex_vi_parts.append(lines[i])
            i += 1
        example_vi = " ".join(ex_vi_parts)

        entries.append(
            {
                "id": num,
                "hanzi": hanzi,
                "pinyin": pinyin,
                "type": wtype,
                "meaning": meaning,
                "example": example,
                "examplePy": example_py,
                "exampleVi": example_vi,
            }
        )

    return entries


def main():
    out_dir = Path(__file__).resolve().parent.parent / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    sources = {
        1: Path("/Users/hoang/Downloads/TỪ VỰNG HSK1 - CHUẨN FORMAT HSK3.0.pdf"),
        2: Path("/Users/hoang/Downloads/Từ hsk 2.pdf"),
        3: Path("/Users/hoang/Downloads/HSK3.pdf"),
        4: Path("/Users/hoang/Downloads/HSK4.pdf"),
    }

    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            p = Path(arg)
            name = p.name.lower()
            if "hsk1" in name or "hsk 1" in name:
                sources[1] = p
            elif "hsk2" in name or "hsk 2" in name:
                sources[2] = p
            elif "hsk3" in name:
                sources[3] = p
            elif "hsk4" in name:
                sources[4] = p

    parsers = {
        1: parse_hsk_table_pdf,
        2: parse_hsk_table_pdf,
        3: parse_hsk3,
        4: parse_hsk4,
    }

    for level, path in sources.items():
        if not path.exists():
            print(f"Skip HSK{level}: missing {path}")
            continue
        entries = parsers[level](str(path))
        out_path = out_dir / f"hsk{level}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=0)
        print(f"Wrote {out_path} ({len(entries)} words)")


if __name__ == "__main__":
    main()
