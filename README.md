# Ôn Tiếng Trung — HSK Flashcard

Web flashcard và bài kiểm tra từ vựng tiếng Trung theo cấp HSK.

## Tính năng

Luồng: **Ôn tập** hoặc **Làm test** → chọn **HSK** → chọn nội dung.

**Ôn tập**
- **Flashcard**: Hán tự → lật xem Pinyin và nghĩa tiếng Việt
- **Ví dụ**: Câu mẫu + tự viết câu → **kiểm tra ngữ pháp bằng AI** (Google Gemini)

**Làm test**
- Hán tự → Pinyin / Tiếng Việt
- Việt / Pinyin → Hán tự

Dữ liệu: **HSK 1, 2, 3, 4** (HSK 5–6 sắp có). HSK 1–2 không có câu ví dụ trong PDF.

### Cài đặt AI (phần Ví dụ)

1. Lấy API key miễn phí tại [Google AI Studio](https://aistudio.google.com/apikey)
2. Trên trang chủ hoặc trang Ví dụ, bấm **Cài đặt API AI**
3. Key chỉ lưu trong trình duyệt (localStorage)

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
