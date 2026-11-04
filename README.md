# Kotoba · Sổ tay từ vựng

Trang học từ vựng tiếng Nhật bằng tiếng Việt. Trang có 8 từ mẫu và chạy bằng HTML, CSS và JavaScript thuần.

## Chạy trên máy

Tại thư mục gốc của repo, chạy:

```sh
python -m http.server 8000
```

Mở [http://localhost:8000](http://localhost:8000). Nếu máy dùng lệnh `python3` hoặc `py`, thay `python` bằng lệnh tương ứng.

## Cách học

- **Flashcard** · Xem chữ Nhật, lật thẻ để xem nghĩa và đánh dấu từ đã nhớ. Dùng mũi tên để chuyển từ.
- **Nghe chép** · Bấm nghe rồi gõ lại bằng kana hoặc kanji đã lưu. Trang chấp nhận hiragana và katakana tương đương, kiểm tra câu trả lời và cho phép xem đáp án.
- **Chế độ đọc** · Chọn một từ, nghe riêng hoặc đọc liên tiếp từ vị trí đó. Thanh **Tốc độ đọc** dùng chung cho mọi chế độ, từ 0.5× đến 1.5×.
- **Từ vựng** · Tìm theo kana, nghĩa hoặc kanji. Bạn có thể thêm, sửa, xóa hoặc nhập nhiều từ cùng lúc.

## Nhập danh sách

Dán danh sách hoặc chọn một tệp UTF-8 `.csv`, `.tsv` hay `.txt`. Mỗi dòng theo thứ tự **kana, nghĩa tiếng Việt, kanji**. Cột kanji không bắt buộc.

```text
つき | mặt trăng | 月
いぬ | con chó | 犬
パン | bánh mì
```

Có thể dùng dấu phẩy hoặc tab thay dấu `|` cho cả danh sách. Nếu nghĩa có dấu phân cách, đặt nghĩa trong ngoặc kép. Trang báo dòng lỗi trước khi lưu và bỏ qua các mục trùng.

Từ vựng, dấu đã nhớ và tốc độ đọc được lưu trong trình duyệt hiện tại. Tính năng nghe dùng giọng đọc tiếng Nhật mà trình duyệt cung cấp. Nếu trang báo thiếu giọng Nhật, hãy thêm giọng tiếng Nhật trong cài đặt đọc văn bản của thiết bị rồi tải lại trang.
