# Ôn Tiếng Trung — HSK Flashcard

Web flashcard và bài kiểm tra từ vựng tiếng Trung theo cấp HSK.

## Tính năng

- **Flashcard**: Hán tự → lật xem Pinyin và nghĩa tiếng Việt
- **Test Hán tự → Pinyin / Việt**: Nhìn chữ Hán, gõ pinyin hoặc nghĩa
- **Test Việt / Pinyin → Hán tự**: Nhìn nghĩa hoặc pinyin, gõ chữ Hán
- Chọn cấp **HSK 1–6** (hiện có dữ liệu **HSK 3** và **HSK 4**)

## Chạy local

```bash
cd ontiengtrung
python3 -m http.server 8080
```

Mở http://localhost:8080

## Cập nhật từ vựng từ PDF

```bash
python3 scripts/extract_vocab.py /path/to/HSK3.pdf /path/to/HSK4.pdf
```

## Deploy

Site tĩnh, deploy qua GitHub Pages.
