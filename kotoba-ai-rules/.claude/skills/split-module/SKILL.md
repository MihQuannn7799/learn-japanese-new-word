---
name: split-module
description: Tách app.js (605 dòng) hoặc words.js thành các module nhỏ (state, storage, audio, dialogs, views, lib) mà KHÔNG đổi hành vi. Dùng khi người dùng muốn dọn cấu trúc, tái cấu trúc repo, hoặc app.js quá dài. Behavior-preserving refactor into ES modules.
---

# split-module

Tái cấu trúc = **không đổi hành vi**. Nếu bạn thấy lỗi trong lúc tách, ghi lại và để sau; đừng sửa lẫn vào commit tái cấu trúc.

## Đích đến gợi ý

```
js/ (hoặc dist/ nếu giữ nguyên thư mục)
├── main.js          # khởi tạo + gắn sự kiện toàn cục
├── state.js         # words, known, speed, mode và các biến trạng thái
├── storage.js       # storageKey, đọc/ghi localStorage
├── audio.js         # speechSynthesis: japaneseVoice, play, stopAudio
├── dialogs.js       # entry / import / delete dialog
├── views/           # flashcard.js, dictation.js, reading.js, vocabulary.js
├── lib/             # kana.js (normalizeKana, answerMatches), import.js (parseImport)
└── data/starter-words.js
```

Đây là gợi ý. Tách theo mức người dùng yêu cầu; có thể chỉ làm 1–2 module trong một lần.

## Quy trình an toàn

1. **Chụp trạng thái gốc.** Chạy `node scripts/check.mjs` và ghi lại kết quả. Đọc danh sách export hiện có (`grep -n "^export" dist/words.js`).
2. **Làm từng module một.** Mỗi lần: di chuyển một nhóm hàm, thêm `export`/`import`, chạy `check.mjs`, commit. Không di chuyển nhiều nhóm rồi mới kiểm tra.
3. **Bắt đầu từ phần ít phụ thuộc nhất:** hàm thuần trong `words.js` (kana, import) → dữ liệu mẫu → storage → audio → views → dialogs.
4. **Trạng thái chia sẻ** (biến `let` ở đầu `app.js`): module khác không gán được trực tiếp biến import. Dùng một object state được export (`export const state = {...}`) rồi đọc/ghi qua `state.xxx`, hoặc đưa hàm getter/setter. Chọn một cách và dùng nhất quán.
5. **Phụ thuộc vòng:** nếu hai module import lẫn nhau, đưa phần dùng chung xuống module thấp hơn (ví dụ `state.js`). Không để vòng.
6. **Đường dẫn:** import tương đối phải có đuôi `.js` (trình duyệt không tự thêm). `index.html` chỉ cần trỏ tới `main.js` (hoặc `app.js` nếu giữ tên).
7. **Nếu đổi thư mục gốc** (ví dụ `dist/` → thư mục gốc hoặc `src/`): cập nhật `scripts/check.mjs` (nó dò `dist`, `src`, `.`), lệnh chạy trong README và mục "Cấu trúc hiện tại" trong `CLAUDE.md`.
8. **Không đổi** `storageKey`, tên `data-action`, id phần tử, class CSS, hay chuỗi hiển thị.

## Kiểm tra sau khi tách

- `node scripts/check.mjs` sạch (nó kiểm tra mọi import tương đối và tên export).
- Chạy server và thử tay: thêm từ, sửa, xóa, nhập danh sách, 4 chế độ, đổi tốc độ đọc, tải lại trang (dữ liệu còn). Nếu không có trình duyệt, nói rõ **chưa kiểm tra bằng trình duyệt** và liệt kê các thao tác người dùng nên thử.
- Dùng `git diff --stat` để chắc chắn không có thay đổi ngoài ý muốn (tổng số dòng nên xấp xỉ bằng nhau, chỉ khác chỗ).

## Thêm test cho phần đã tách (nếu người dùng đồng ý)

Phần thuần (`kana`, `import`) dễ test nhất. Dùng `node:test`, đặt trong `tests/*.test.mjs`; `check.mjs` sẽ tự chạy chúng. Các ca nên có: hiragana/katakana tương đương trong `answerMatches`, dấu phân cách `|` `,` tab, ngoặc kép, dòng lỗi, từ trùng.
