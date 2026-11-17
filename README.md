# Kotoba · Sổ tay từ vựng

Trang học từ vựng tiếng Nhật bằng tiếng Việt, dùng **Vite + TypeScript + WanaKana**. Trang có 8 từ mẫu, 4 chế độ học và backend Node.js lưu sổ tay trong SQLite.

![Giao diện chế độ Flashcard của Kotoba](docs/kotoba-flashcard.jpg)

## Clone và chạy trên máy

Cần Git và Node.js 22.13 trở lên. Chạy các lệnh sau trong PowerShell, Git Bash hoặc Terminal. Trong PowerShell, nếu `npm` bị chặn bởi Execution Policy, dùng `npm.cmd` thay cho `npm`.

```sh
git clone https://github.com/MihQuannn7799/learn-japanese-new-word.git
cd learn-japanese-new-word
npm ci
npm run dev
```

Mở [http://localhost:8000](http://localhost:8000). Vite phục vụ giao diện và cập nhật khi sửa mã; API SQLite dùng chung máy chủ và địa chỉ. Máy chủ chỉ nghe trên máy của bạn. Nhấn `Ctrl+C` để dừng. Cần mạng để cài các gói npm lần đầu; ứng dụng không dùng CDN, tài khoản hay API key.

Chạy `npm start` để kiểm tra kiểu, tạo bản build Vite và phục vụ `dist/` cùng API SQLite tại địa chỉ trên. `npm run preview` chỉ xem bản tĩnh đã build, lưu sổ tay trong trình duyệt.

Sổ tay, dấu đã nhớ và thiết lập học được ghi vào `backend/storage/kotoba.sqlite`. Ở lần mở đầu tiên với SQLite trống, Kotoba chép sổ tay đang lưu tại đúng địa chỉ `localhost:8000` sang SQLite và giữ bản lưu trình duyệt. Nếu dữ liệu cũ nằm ở trình duyệt hoặc địa chỉ khác, nó vẫn nằm ở địa chỉ cũ. Có thể sao lưu tệp SQLite sau khi dừng máy chủ.

## Kho Minna Nhật–Việt và gợi ý kanji

- **Thêm từ mới** · Gõ hiragana hoặc katakana để tra cách viết. Chọn kanji phù hợp trong các gợi ý hoặc tự nhập. Kana có thể trùng giữa nhiều từ.
- **Kho Minna** · 1.929 mục Nhật–Việt trong 50 bài Minna N5–N4, gồm từ vựng và cách nói giao tiếp. Chọn số bài hoặc danh sách bài để tìm theo kana, kanji, âm Hán Việt hay nghĩa tiếng Việt. Bài 2 có 47 mục.
- Chuyển giữa **Danh sách** và **Thẻ từ**. Thẻ trình bày chữ Nhật, cách đọc, âm Hán Việt, nghĩa và câu ví dụ Nhật–Việt; có loa nghe từ và câu. Có thể bật/tắt cách đọc trong kho từ.
- **Thêm cả bài** thêm toàn bộ mục của bài, kể cả khi đang tìm kiếm. **Tất cả 50 bài** tìm trong toàn kho. Khi thêm vào sổ tay, app bỏ qua cách đọc/cách viết đã có; một số mục xuất hiện ở nhiều bài nên số thẻ thêm có thể ít hơn số mục hiển thị.
- Dữ liệu và gợi ý kanji đều được đóng gói trong app, có nghĩa tiếng Việt. Kho dùng toàn bộ mục của bản nguồn cộng đồng đã ghi nhận trong [nguồn và giấy phép](frontend/public/data/SOURCES.md).
- Các thẻ còn nguyên nghĩa tiếng Anh từ kho N5 cũ được chuyển sang nghĩa Việt khi mở app, giữ ID và tiến độ học. App không ghi đè những nghĩa/cách viết bạn đã tự sửa.
- WanaKana chuẩn hóa hiragana/katakana khi tìm kiếm, tra kanji và kiểm tra đáp án. Cách đọc vẫn giữ dấu kéo dài `ー`; tìm nghĩa tiếng Việt/Anh không tự chuyển thành kana.

## Cách học

- **Flashcard** · Chạm thẻ hoặc nhấn `Space` để xem nghĩa, kana và câu ví dụ nếu có. Vuốt trái cho từ **Chưa nhớ**, vuốt phải cho từ **Đã nhớ**. Bạn cũng có thể dùng hai nút bên dưới thẻ hoặc phím `←` / `→`.
- Chọn **Ngẫu nhiên** để xáo toàn bộ từ trong sổ tay, **Chưa nhớ** để ôn từ chưa nhớ, hoặc **Đã nhớ** để kiểm tra lại từ đã nhớ. Phần trăm dùng tổng số thẻ ở đầu lượt học và cập nhật sau mỗi lần đánh dấu. Chọn lại bộ thẻ hoặc bấm **Học lại bộ này** ở cuối lượt để cập nhật danh sách.
- **Nghe chép** · Chọn **Nghe cả danh sách** để phát từng dòng từ trên xuống. Bấm biểu tượng loa để nghe một dòng đúng một lần, gõ kana hoặc kanji và chọn **Kiểm tra**. Có thể xem đáp án ở từng dòng.
- **Chế độ đọc** · Bấm chữ Nhật hoặc chọn một dòng để nghe từ một lần ở tốc độ 1×. Chọn **Tự đọc từ** hoặc **Tự đọc từ + câu** để phát liên tiếp từ vị trí đang chọn. Có thể nghe câu riêng và bật/tắt cách đọc hoặc nghĩa tiếng Việt.
- **Cài đặt danh sách** · Chỉnh tốc độ (0,5×–1,5×), số lần đọc mỗi từ (1–5) và khoảng nghỉ giữa hai từ (0–5 giây). Khi đọc kèm câu, mỗi câu ví dụ được phát một lần sau các lượt đọc từ. Dòng chưa có câu vẫn phát từ bình thường.
- **Từ vựng** · Xem dạng danh sách hoặc thẻ từ dọc, tìm theo kana, nghĩa, kanji hay âm Hán Việt. Bạn có thể thêm, sửa, xóa hoặc nhập nhiều từ cùng lúc. Khi thêm hoặc sửa từ, có thể nhập câu ví dụ và bản dịch.
- **Xóa toàn bộ thẻ** · Trong **Từ vựng**, chọn **Xóa toàn bộ thẻ** rồi xác nhận để xóa mọi thẻ trong sổ tay và tiến độ học, kể cả các thẻ không hiện do tìm kiếm. Thao tác không thể hoàn tác; thiết lập học và kho Minna vẫn được giữ.

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

- `frontend/index.html` là điểm vào Vite; `frontend/src/` chứa TypeScript và CSS, chia thành state, storage, audio, dialogs, catalog, views và lib.
- `frontend/public/` chứa icon, dữ liệu từ điển và thông báo nguồn, được Vite chép nguyên vẹn vào `dist/`.
- `shared/` chứa kiểu từ vựng/sổ tay/API, chuẩn hóa kana bằng WanaKana, kiểm tra từ và thiết lập dùng chung; backend không phụ thuộc mã giao diện.
- `backend/` chứa TypeScript phục vụ giao diện và API sổ tay. Node.js chạy TypeScript bằng `--experimental-strip-types`; SQLite kiểm tra phiên bản trước khi ghi để hai cửa sổ không ghi đè dữ liệu của nhau.
- `npm test` chạy kiểm thử Node.js. `npm run typecheck` kiểm tra TypeScript ở chế độ strict. `npm run check` kiểm tra thêm cú pháp script, import, đường dẫn, dấu xung đột và chạy test.
- `npm run build` kiểm tra kiểu và tạo bản tĩnh ở `dist/`, có thể đặt dưới đường dẫn con như GitHub Pages. `npm run validate:vocab -- danh-sach.csv` kiểm tra tệp từ vựng trước khi nhập.
- `npm run data:import -- <thư-mục-cache> --download` tải lại dữ liệu từ phiên bản nguồn cố định và tạo catalog, chỉ mục kanji, danh sách bài, bản ghi số mục/hash từng bài. Bỏ `--download` để tạo lại từ bản cache mà không gọi mạng. Các lỗi nguồn được sửa rõ ràng trong `scripts/data/minna-corrections.json`; không bỏ qua mục lỗi khi nhập.

## GitHub Pages

Bản GitHub Pages lưu sổ tay trong trình duyệt. Để xuất bản demo công khai, chọn **Settings → Pages → Source → GitHub Actions** trong repo, rồi chạy **Actions → Publish Kotoba to GitHub Pages → Run workflow** trên nhánh `main`. Sau khi thiết lập, các lần push lên `main` chạy kiểm thử và cập nhật bản demo. GitHub hiển thị URL trong **Settings → Pages** sau khi triển khai thành công.

## Giấy phép

Mã nguồn dùng [giấy phép MIT](LICENSE). Kho Minna Nhật–Việt dùng [MIT của nguồn](frontend/public/data/LICENSE-MINNA-MIT.txt); dữ liệu nâng cấp kho OpenJLPT cũ giữ [CC BY-SA 4.0](frontend/public/data/LICENSE-CC-BY-SA-4.0.txt). Bản build kèm giấy phép MIT của WanaKana trong `LICENSE-WANAKANA.txt`.

Tài liệu công nghệ: [Vite](https://vite.dev/guide/), [TypeScript](https://www.typescriptlang.org/docs/), [WanaKana](https://wanakana.com/).
