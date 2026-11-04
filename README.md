# Kotoba · Sổ tay từ vựng

Trang học từ vựng tiếng Nhật bằng tiếng Việt. Trang có 8 từ mẫu và chạy bằng HTML, CSS và JavaScript thuần.

[Mở bản riêng tư trên ChatGPT](https://kotoba-nhat-ky-tu-vung.meanderingbun.chatgpt.site/) (cần đăng nhập).

![Giao diện chế độ Flashcard của Kotoba](docs/kotoba-flashcard.jpg)

## Chạy trên máy

Tại thư mục gốc của repo, chạy:

```sh
python -m http.server 8000
```

Mở [http://localhost:8000](http://localhost:8000). Có thể dùng `npm start` nếu máy có Node.js và lệnh `python`. Trên máy dùng `python3` hoặc `py`, thay `python` bằng lệnh tương ứng.

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

## Mã nguồn và kiểm thử

- `index.html`, `icons.svg` và `css/` chứa khung trang, biểu tượng và kiểu giao diện.
- `js/views/` chứa bốn chế độ học. `js/lib/` chứa logic chuẩn hóa kana và nhập danh sách. Từ mẫu nằm trong `js/data/starter-words.js`.
- `npm test` chạy kiểm thử bằng Node.js 22 trở lên. `npm run build` chép tệp cần phục vụ sang `dist/` để triển khai. Các lệnh này không cần cài thư viện.

## GitHub Pages

Để xuất bản demo công khai, chọn **Settings → Pages → Source → GitHub Actions** trong repo, rồi chạy **Actions → Publish Kotoba to GitHub Pages → Run workflow** trên nhánh `main`. Sau khi thiết lập, các lần push lên `main` chạy kiểm thử và cập nhật bản demo. GitHub hiển thị URL trong **Settings → Pages** sau khi triển khai thành công.

Dữ liệu lưu theo địa chỉ trang. Bản trên ChatGPT và bản GitHub Pages có sổ tay riêng trên cùng trình duyệt.

## Giấy phép

Mã nguồn dùng [giấy phép MIT](LICENSE).
