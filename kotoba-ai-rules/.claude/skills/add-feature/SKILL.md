---
name: add-feature
description: Thêm một tính năng nhỏ hoặc vừa vào Kotoba (nút mới, tùy chọn mới, trường dữ liệu mới, xuất dữ liệu, tìm kiếm, sắp xếp). Dùng cho thay đổi không phải chế độ học mới. Add a feature to the existing app.
---

# add-feature

Dùng cùng skill `vibe`. Skill này nói cách chèn tính năng vào kiến trúc hiện có mà không phá vỡ nó.

## Bản đồ nơi sửa

| Muốn thêm | Sửa ở |
|---|---|
| Nút trên thanh trên cùng | `dist/index.html` (`.top-actions`) + xử lý trong listener `click` của `app.js` qua `data-action` |
| Hộp thoại mới | Thêm `<dialog>` trong `index.html` theo mẫu `#entry-dialog`; mở/đóng qua hàm tương tự `openEntry` và `data-action="close"` |
| Icon mới | Thêm `<symbol id="i-...">` vào `.symbol-library` trong `index.html`, dùng bằng hàm `icon('...')` |
| Trường dữ liệu mới của từ | `makeWord` trong `words.js`, `wordKey` nếu ảnh hưởng việc phát hiện trùng, form trong `index.html`, `parseImport` nếu import cần hỗ trợ |
| Thiết lập mới được nhớ (như tốc độ đọc) | Thêm vào object lưu trong `storeNotebook()` và đọc có giá trị mặc định ở phần khởi tạo `saved` |
| Hàm thuần mới (so khớp, sắp xếp, lọc) | `words.js` hoặc module mới, **không** chạm DOM |
| Thông báo ngắn | `toast('...')` |

## Quy trình

1. Xác định tính năng chạm vào phần nào ở bảng trên. Đọc đúng các hàm đó.
2. Nếu thêm **trường dữ liệu mới**: dữ liệu cũ trong `localStorage` không có trường này. Đặt giá trị mặc định khi đọc, đừng giả định nó tồn tại. Không đổi `storageKey`.
3. Viết logic thuần trước, kiểm tra bằng một đoạn Node ngắn hoặc thêm test trong `tests/` (tạo thư mục nếu chưa có, dùng `node:test`).
4. Gắn vào giao diện bằng `data-action`, cập nhật `render()`.
5. Escape mọi chuỗi động bằng `escapeHtml`.
6. Chữ hiển thị bằng tiếng Việt, dùng thuật ngữ đã có trong app.
7. Chạy skill `verify`.

## Lỗi thường gặp cần tránh

- Quên `storeNotebook()` sau khi đổi state, khiến dữ liệu mất khi tải lại.
- Quên `stopAudio()` khi hành động làm đổi từ đang đọc.
- Sửa DOM trực tiếp thay vì đổi state rồi `render()`.
- Hardcode màu thay vì dùng biến `:root`.
- Thêm nút chỉ có icon mà thiếu `aria-label`.
