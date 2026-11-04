---
name: review-changes
description: Tự duyệt diff của chính mình trước khi commit hoặc báo xong; tìm lỗi bảo mật, hồi quy, vi phạm quy ước của repo. Dùng sau khi viết xong code và trước khi commit. Self-review checklist.
---

# review-changes

Đọc diff như một người duyệt khó tính chưa từng thấy code này.

```sh
git status
git diff            # thay đổi chưa stage
git diff --staged   # đã stage
```

## Checklist

**Phạm vi**
- [ ] Diff chỉ chứa những gì được yêu cầu. Không có sửa lan man, đổi tên không cần thiết, định dạng lại cả file.
- [ ] Không có file rác (log, bản sao `.bak`, file tạm, `node_modules`).

**An toàn**
- [ ] Mọi chuỗi động đưa vào HTML đều qua `escapeHtml`. Không `innerHTML` với dữ liệu người dùng hoặc từ file import chưa escape.
- [ ] Không có URL ngoài, CDN, `fetch` tới máy chủ khác, tracking.
- [ ] Không có bí mật hoặc đường dẫn cá nhân.
- [ ] `storageKey` không đổi; dữ liệu cũ vẫn đọc được.

**Đúng đắn**
- [ ] Sau khi đổi state có gọi `storeNotebook()` và `render()`.
- [ ] `stopAudio()` được gọi ở nơi cần.
- [ ] Xử lý sổ tay rỗng, 1 từ, từ không có kanji.
- [ ] Không có `console.log` gỡ lỗi, code chết, biến không dùng.
- [ ] Bắt lỗi ở nơi thật sự có thể lỗi (localStorage, speechSynthesis, parse import), và không nuốt lỗi âm thầm.

**Quy ước**
- [ ] Màu dùng biến `:root`; chữ Nhật có `lang="ja"`.
- [ ] Nút icon có `aria-label`; điều khiển mới dùng được bằng bàn phím.
- [ ] Chữ hiển thị bằng tiếng Việt, đúng thuật ngữ hiện có. Code, tên biến bằng tiếng Anh.
- [ ] README cập nhật nếu hành vi người dùng thấy đã đổi.

**Kiểm tra**
- [ ] `node scripts/check.mjs` sạch trên đúng trạng thái sắp commit.

## Sau khi duyệt

- Có vấn đề: sửa, chạy lại `verify`, duyệt lại phần đã sửa.
- Ổn: `git add` đúng các file liên quan (không `git add -A` mù quáng), commit một ý, thông điệp mệnh lệnh ngắn bằng tiếng Anh. Không `git push`.
- Trong báo cáo cuối, nói thẳng nếu bạn thấy chỗ nào còn yếu.
