#!/usr/bin/env python3
"""Extract HSK vocabulary from PDF files into JSON."""
import fitz
import re
import json
import sys
from pathlib import Path


def is_hanzi_line(s):
    return bool(re.search(r"[\u4e00-\u9fff]", s)) and len(
        re.findall(r"[\u4e00-\u9fff]", s)
    ) >= max(1, len(s) * 0.3)


def is_pinyin_line(s):
    return bool(
        re.match(
            r"^[a-zA-ZāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüÜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛ\s,·\-]+$",
            s,
        )
    )


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

    hsk3_path = Path("/Users/hoang/Downloads/HSK3.pdf")
    hsk4_path = Path("/Users/hoang/Downloads/HSK4.pdf")

    if len(sys.argv) >= 3:
        hsk3_path = Path(sys.argv[1])
        hsk4_path = Path(sys.argv[2])

    e3 = parse_hsk3(str(hsk3_path))
    e4 = parse_hsk4(str(hsk4_path))

    for level, entries in [(3, e3), (4, e4)]:
        path = out_dir / f"hsk{level}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=0)
        print(f"Wrote {path} ({len(entries)} words)")


if __name__ == "__main__":
    main()
