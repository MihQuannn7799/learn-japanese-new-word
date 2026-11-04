---
name: add-study-mode
description: Thêm một chế độ học mới ngoài Flashcard, Nghe chép, Chế độ đọc, Từ vựng (ví dụ trắc nghiệm, ôn từ sai, ghép cặp, gõ romaji). Dùng khi người dùng muốn một cách luyện tập mới. Add a new study mode tab.
---

# add-study-mode

Mỗi chế độ hiện có đi theo cùng một mẫu. Chế độ mới phải **trông và hoạt động như người cùng nhà**.

## Mẫu của một chế độ

Mỗi chế độ gồm:
1. **Nút điều hướng** trong `<nav class="modes">` ở `index.html`: `<button class="mode" data-action="mode" data-mode="TÊN">` kèm icon và nhãn tiếng Việt.
2. **Hàm view** `TÊNView(word)` trong `app.js` trả về chuỗi HTML (xem `flashView`, `dictationView`, `readingView`).
3. **Nhánh trong `render()`** để gọi view đó khi `mode === 'TÊN'`.
4. **State riêng** (chỉ số hiện tại, câu trả lời...) khai báo cùng nhóm biến `let` ở đầu `app.js`, có hàm reset nếu cần (xem `resetDictation`).
5. **`currentWord()`** có nhánh cho chế độ mới nếu chế độ làm việc trên một từ.
6. **Phím tắt** (nếu có) trong listener `keydown`, chỉ hoạt động khi đúng chế độ và không đang gõ trong ô nhập.

## Quy trình

1. Chọn tên chế độ (kebab-case ngắn, tiếng Anh) và nhãn hiển thị (tiếng Việt, 1–3 chữ, cùng giọng với "Flashcard", "Nghe chép", "Chế độ đọc").
2. Chọn hoặc vẽ icon mới theo phong cách các `<symbol>` hiện có (viewBox 24, nét 1.75, không tô).
3. Tách **logic chấm điểm / chọn từ / xáo trộn** thành hàm thuần (trong `words.js` hoặc module mới) để test được.
4. Viết view dùng lại các class có sẵn: `stepper`, `progressPanel`, `speedPanel`, `japanese()`, nút `.btn`, thẻ card. Không tạo phong cách riêng.
5. Gắn vào `switchMode`. Đảm bảo `stopAudio()` chạy khi rời chế độ, và focus chuyển về tiêu đề chế độ cho người dùng bàn phím.
6. Xử lý **sổ tay rỗng** và **chỉ có 1 từ** (không lỗi, có thông báo thân thiện).
7. Dùng dữ liệu `known` (từ đã nhớ) nếu chế độ có ý nghĩa với việc đó; nếu chế độ ghi nhận tiến độ mới, lưu trong cùng object `storeNotebook()` với giá trị mặc định cho dữ liệu cũ.
8. Cập nhật README, mục "Cách học": một gạch đầu dòng cho chế độ mới, cùng văn phong.
9. Chạy skill `verify`.

## Kiểm tra riêng cho chế độ mới

- Sổ tay 0 từ, 1 từ, nhiều từ.
- Thêm/sửa/xóa từ khi đang ở chế độ này vẫn không lỗi (`refreshAfterEdit`).
- Chuyển qua lại giữa các chế độ không giữ lại trạng thái hỏng.
- Dùng được hoàn toàn bằng bàn phím.
- Hiển thị ổn ở ~375px.
