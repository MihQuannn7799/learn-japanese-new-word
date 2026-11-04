# Kotoba · Sổ tay từ vựng tiếng Nhật

Web học từ vựng Nhật–Việt: flashcard, nghe chép, chế độ đọc, quản lý từ vựng.
Chạy bằng **Vite + TypeScript strict + WanaKana**, giao diện DOM không dùng framework. Backend cũng dùng TypeScript.
Backend Node.js lưu sổ tay trong SQLite và giao diện giữ bản lưu trong `localStorage`; giọng đọc dùng `speechSynthesis` của trình duyệt.

## Chế độ làm việc: vibe coding tự chủ

Người dùng thường chỉ nói ý tưởng mơ hồ ("thêm chế độ ôn từ sai", "làm đẹp hơn"). Việc của bạn là **tự quyết định và làm xong**, không hỏi lại những điều có thể suy ra.

1. **Hiểu → làm → kiểm tra → báo cáo.** Dùng skill `vibe` cho mọi yêu cầu không tầm thường.
2. **Chỉ hỏi khi** thay đổi không thể hoàn tác (xóa dữ liệu người dùng, đổi `storageKey`, đổi định dạng lưu trữ) hoặc yêu cầu thực sự mâu thuẫn nhau. Còn lại: chọn phương án hợp lý nhất, ghi rõ giả định trong báo cáo cuối.
3. **Làm nhỏ, xong từng bước.** Mỗi bước phải chạy được. Không để repo ở trạng thái hỏng giữa chừng.
4. **Luôn tự kiểm tra** bằng `node scripts/check.mjs` trước khi báo xong. Chưa chạy kiểm tra thì chưa được nói "xong".
5. **Không mở rộng phạm vi.** Làm đúng điều được yêu cầu. Thấy việc khác đáng làm thì ghi vào phần "Gợi ý tiếp theo" của báo cáo, đừng tự làm.

## Cấu trúc hiện tại

Mã giao diện nằm trong `frontend/`. `dist/` là bản tĩnh được tạo bởi `npm run build`.

```
frontend/
├── index.html               # điểm vào Vite, giao diện tiếng Việt
├── src/                     # TypeScript: chế độ học, tra kanji, đồng bộ, styles/
└── public/                  # icon và data/ từ điển có ghi nguồn
shared/                      # kiểu sổ tay, kana, kiểm tra từ, thiết lập dùng chung
backend/                     # TypeScript: HTTP, API sổ tay và SQLite
vite.config.ts               # Vite, build dist/, hỗ trợ đường dẫn con
scripts/check.mjs            # kiểm tra tĩnh và test
scripts/validate-vocab.mjs   # kiểm tra danh sách trước khi nhập
```

## Chạy thử

```sh
npm ci
npm run dev               # Vite + API SQLite tại http://localhost:8000
npm start                 # build và phục vụ dist/ + API SQLite
node scripts/check.mjs
```

## Quy ước code

**TypeScript**
- ES modules, `const`/`let`, không `var`. Dùng TypeScript strict, kiểu dùng chung trong `shared/notebook.ts`, trạng thái học trong `frontend/src/types.ts`. Không dùng `any` hay tắt kiểm tra kiểu để né lỗi.
- Vite, TypeScript, WanaKana và kiểu Node.js đã được người dùng yêu cầu/chấp thuận. Không thêm thư viện khác hay CDN nếu chưa có yêu cầu.
- Logic thuần dùng chung (kana, kiểm tra từ, so khớp đáp án) đặt trong `shared/`; bộ đọc file import ở `frontend/src/lib/import.ts`. Không đụng DOM, để test được bằng Node. Dùng WanaKana để chuẩn hóa kana; giữ dấu kéo dài và chữ Latin khi tìm nghĩa.
- Mọi chuỗi từ người dùng hoặc dữ liệu đưa vào HTML phải đi qua `escapeHtml`. Không dùng `innerHTML` với dữ liệu chưa escape.
- Dùng event delegation hiện có (`data-action`, `data-mode`) thay vì gắn listener rời rạc.
- `render()` vẽ lại giao diện từ state. Đổi state rồi gọi `render`, không sửa DOM rải rác.
- Gọi `storeNotebook()` sau mọi thay đổi `words`, `known`, `speed`.
- Dừng audio (`stopAudio`) khi đổi chế độ hoặc rời trang.

**Lưu trữ**
- `storageKey = 'kotoba.notebook.v1'`. **Không đổi** nếu chưa có migration, vì sẽ làm mất dữ liệu người dùng.
- Thêm trường mới vào dữ liệu thì phải chịu được dữ liệu cũ thiếu trường đó (giá trị mặc định khi đọc).
- Từ trùng được xác định bởi `wordKey`. Giữ nguyên hành vi này.

**CSS**
- Dùng biến ở `:root` (`--paper`, `--ink`, `--green`, `--sage`, `--gold`...). Không hardcode màu mới nếu đã có biến gần giống.
- Chữ Nhật gắn `lang="ja"` để dùng đúng font.
- Responsive: kiểm tra ở chiều rộng ~375px và ~1120px. `.shell` đang giới hạn `min(1120px, calc(100% - 64px))`.
- Giữ `:focus-visible` rõ ràng, không bỏ outline.

**HTML và truy cập (a11y)**
- Nút có icon thì phải có `aria-label` hoặc chữ đi kèm. Icon trang trí dùng `aria-hidden="true"`.
- Dialog dùng thẻ `<dialog>` có `aria-labelledby`. Thông báo động dùng `role="status"`/`role="alert"`.
- Mọi chức năng dùng được bằng bàn phím.

**Ngôn ngữ giao diện**
- Toàn bộ chữ hiển thị cho người dùng bằng **tiếng Việt**, giọng thân thiện, ngắn gọn, xưng "bạn".
- Thuật ngữ đã dùng trong app phải giữ nhất quán: *Flashcard, Nghe chép, Chế độ đọc, Từ vựng, Sổ tay, Tốc độ đọc, đã nhớ*.
- Tên biến, tên hàm, comment trong code: tiếng Anh. README và tài liệu cho người dùng: tiếng Việt.

## Ranh giới an toàn (không được làm)

- Không `git push --force`, không `git reset --hard`, không xóa nhánh, không sửa lịch sử đã có.
- Không xóa hoặc ghi đè dữ liệu `localStorage` của người dùng khi chưa có migration.
- Không thêm tracking, analytics, quảng cáo, hay gọi mạng ra ngoài. Không gọi dịch vụ bên ngoài khi chạy app. API sổ tay chạy cùng địa chỉ local.
- Không commit bí mật (`.env`, khóa API, token). Repo này không cần bí mật nào.
- Không tải script từ CDN. Mọi thứ tự chứa trong repo.
- Dữ liệu từ file import là **không đáng tin**: luôn qua `parseImport`, giới hạn `importLimit`, escape khi hiển thị.

## Git

- Commit nhỏ, mỗi commit một ý. Thông điệp ngắn, thể hiện mệnh lệnh, ví dụ: `Add wrong-words review mode`.
- Không commit khi `node scripts/check.mjs` còn lỗi.
- Không tự `git push`. Chỉ commit cục bộ; để người dùng quyết định push.
- Không tự tạo nhánh hay PR trừ khi được yêu cầu.

## Định nghĩa "xong"

Một thay đổi chỉ được coi là xong khi:
1. `node scripts/check.mjs` chạy sạch.
2. Chức năng mới hoạt động trong trình duyệt (hoặc đã nói rõ là chưa kiểm tra bằng trình duyệt thật).
3. Không làm hỏng 4 chế độ hiện có và việc lưu dữ liệu.
4. README được cập nhật nếu hành vi người dùng thấy đã đổi.
5. Báo cáo cuối nêu: đã làm gì, đã kiểm tra gì, giả định nào đã chọn, gợi ý tiếp theo.

## Skills có sẵn (`.claude/skills/`)

| Skill | Dùng khi |
|---|---|
| `vibe` | Mọi yêu cầu mơ hồ hoặc nhiều bước; vòng lặp tự chủ chuẩn |
| `add-feature` | Thêm tính năng vào app hiện có |
| `add-study-mode` | Thêm chế độ học mới (ngoài 4 chế độ hiện tại) |
| `split-module` | Tách `app.js`/`words.js` thành module nhỏ mà không đổi hành vi |
| `vocab-data` | Thêm, kiểm tra, nhập danh sách từ vựng (N5, N4...) |
| `verify` | Kiểm tra trước khi báo xong |
| `review-changes` | Tự duyệt diff trước khi commit |
| `deploy-pages` | Đưa trang lên GitHub Pages |
