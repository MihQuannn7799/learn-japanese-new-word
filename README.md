# Kotoba · Sổ tay từ vựng

Trang học từ vựng tiếng Nhật bằng tiếng Việt. Trang có 8 từ mẫu và chạy bằng HTML, CSS và JavaScript thuần.

![Giao diện chế độ Flashcard của Kotoba](docs/kotoba-flashcard.jpg)

## Clone và chạy trên máy

Cần Git và Node.js 22.13 trở lên. Chạy các lệnh sau trong PowerShell, Git Bash hoặc Terminal.

```sh
git clone https://github.com/MihQuannn7799/learn-japanese-new-word.git
cd learn-japanese-new-word
npm start
```

Mở [http://localhost:8000](http://localhost:8000). Máy chủ chỉ nghe trên máy của bạn. Nhấn `Ctrl+C` để dừng. Kotoba không cần cài thư viện, tài khoản hoặc API key.

Sổ tay, dấu đã nhớ và thiết lập học được ghi vào `backend/storage/kotoba.sqlite`. Ở lần mở đầu tiên với SQLite trống, Kotoba chép sổ tay đang lưu tại đúng địa chỉ `localhost:8000` sang SQLite và giữ bản lưu trình duyệt. Nếu dữ liệu cũ nằm ở trình duyệt hoặc địa chỉ khác, nó vẫn nằm ở địa chỉ cũ. Có thể sao lưu tệp SQLite sau khi dừng máy chủ.

## Kho N5 và gợi ý kanji

- **Thêm từ mới** · Gõ hiragana hoặc katakana để tra cách viết. Chọn kanji phù hợp trong các gợi ý hoặc tự nhập. Kana có thể trùng giữa nhiều từ.
- **Kho N5** · 674 mục được chia theo chủ đề của 25 bài *Minna no Nihongo Sơ cấp I, bản 2*. Chọn **Bài học** để tìm trong bài theo kana, kanji hoặc nghĩa tiếng Anh. Chọn **Thêm cả bài** để thêm toàn bộ từ của bài đã chọn, kể cả khi đang tìm kiếm. Kho từ bỏ qua mục có cùng cách đọc và cách viết trong sổ tay.
- Chọn **Tất cả 25 bài** để tìm trong toàn bộ kho. Khi thêm từng từ, bạn có thể đổi nghĩa sang tiếng Việt. Các bài dùng dữ liệu OpenJLPT được phân nhóm theo chủ đề để ôn tập.
- Dữ liệu tra cứu được đóng gói cùng app, dùng mục từ từ N5 đến N1. Phân cấp N5 là danh sách tham khảo. Xem [nguồn và giấy phép](frontend/data/SOURCES.md).

## Cách học

- **Flashcard** · Chạm thẻ hoặc nhấn `Space` để xem nghĩa, kana và câu ví dụ nếu có. Vuốt trái cho từ **Chưa nhớ**, vuốt phải cho từ **Đã nhớ**. Bạn cũng có thể dùng hai nút bên dưới thẻ hoặc phím `←` / `→`.
- Chọn **Ngẫu nhiên** để xáo toàn bộ từ trong sổ tay, **Chưa nhớ** để ôn từ chưa nhớ, hoặc **Đã nhớ** để kiểm tra lại từ đã nhớ. Phần trăm dùng tổng số thẻ ở đầu lượt học và cập nhật sau mỗi lần đánh dấu. Chọn lại bộ thẻ hoặc bấm **Học lại bộ này** ở cuối lượt để cập nhật danh sách.
- **Nghe chép** · Chọn **Nghe cả danh sách** để phát từng dòng từ trên xuống. Bấm biểu tượng loa để nghe một dòng đúng một lần, gõ kana hoặc kanji và chọn **Kiểm tra**. Có thể xem đáp án ở từng dòng.
- **Chế độ đọc** · Bấm chữ Nhật hoặc chọn một dòng để nghe từ một lần ở tốc độ 1×. Chọn **Tự đọc từ** hoặc **Tự đọc từ + câu** để phát liên tiếp từ vị trí đang chọn. Có thể nghe câu riêng và bật/tắt cách đọc hoặc nghĩa tiếng Việt.
- **Cài đặt danh sách** · Chỉnh tốc độ (0,5×–1,5×), số lần đọc mỗi từ (1–5) và khoảng nghỉ giữa hai từ (0–5 giây). Khi đọc kèm câu, mỗi câu ví dụ được phát một lần sau các lượt đọc từ. Dòng chưa có câu vẫn phát từ bình thường.
- **Từ vựng** · Tìm theo kana, nghĩa hoặc kanji. Bạn có thể thêm, sửa, xóa hoặc nhập nhiều từ cùng lúc. Khi thêm hoặc sửa từ, có thể nhập câu ví dụ và bản dịch.

## Nhập danh sách

Dán danh sách hoặc chọn một tệp UTF-8 `.csv`, `.tsv` hay `.txt`. Mỗi dòng theo thứ tự **kana, nghĩa tiếng Việt, kanji**. Cột kanji không bắt buộc.

```text
つき | mặt trăng | 月
いぬ | con chó | 犬
パン | bánh mì
```

Có thể dùng dấu phẩy hoặc tab thay dấu `|` cho cả danh sách. Nếu nghĩa có dấu phân cách, đặt nghĩa trong ngoặc kép. Trang báo dòng lỗi trước khi lưu và bỏ qua các mục trùng.

Tính năng nghe dùng giọng đọc tiếng Nhật mà trình duyệt cung cấp. Nếu trang báo thiếu giọng Nhật, hãy thêm giọng tiếng Nhật trong cài đặt đọc văn bản của thiết bị rồi tải lại trang.

## Cấu trúc và kiểm thử

- `frontend/` chứa giao diện, mã học từ và dữ liệu từ điển.
- `backend/` phục vụ giao diện và API sổ tay. SQLite kiểm tra phiên bản trước khi ghi để hai cửa sổ không ghi đè dữ liệu của nhau.
- `npm test` chạy kiểm thử. `npm run check` kiểm tra thêm cú pháp, import và đường dẫn. `npm run build` tạo bản tĩnh ở `dist/`.

## GitHub Pages

Bản GitHub Pages lưu sổ tay trong trình duyệt. Để xuất bản demo công khai, chọn **Settings → Pages → Source → GitHub Actions** trong repo, rồi chạy **Actions → Publish Kotoba to GitHub Pages → Run workflow** trên nhánh `main`. Sau khi thiết lập, các lần push lên `main` chạy kiểm thử và cập nhật bản demo. GitHub hiển thị URL trong **Settings → Pages** sau khi triển khai thành công.

## Giấy phép

Mã nguồn dùng [giấy phép MIT](LICENSE). Dữ liệu OpenJLPT dùng [CC BY-SA 4.0](frontend/data/LICENSE-CC-BY-SA-4.0.txt).
