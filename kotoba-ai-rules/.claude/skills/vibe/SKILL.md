---
name: vibe
description: Quy trình tự chủ cho mọi yêu cầu mơ hồ hoặc nhiều bước ("thêm chế độ ôn từ sai", "làm đẹp hơn", "sửa lỗi nghe chép"). Dùng khi người dùng nói ý tưởng thay vì đặc tả chi tiết. Autonomous vibe-coding loop for Kotoba.
---

# vibe: vòng lặp tự chủ

Mục tiêu: biến một ý tưởng mơ hồ thành thay đổi hoạt động được, đã kiểm tra, mà **không bắt người dùng trả lời hàng loạt câu hỏi**.

## 1. Hiểu (ngắn)

- Đọc `CLAUDE.md` nếu chưa đọc trong phiên này.
- Đọc đúng các file liên quan (Grep trước, đừng đọc cả repo). Với yêu cầu về giao diện, đọc `render()` và view tương ứng trong `app.js`.
- Viết ra **1 đoạn** mô tả điều bạn sẽ làm và **các giả định** bạn chọn. Không dừng lại chờ xác nhận, trừ khi gặp trường hợp ở mục "Khi nào được hỏi".

## 2. Lập kế hoạch nhỏ

- Chia thành 2–6 bước, mỗi bước kết thúc ở trạng thái **chạy được**.
- Bước đầu luôn là lát cắt mỏng nhất cho thấy kết quả (ví dụ: nút mới hiện ra và bấm được) rồi mới làm đẹp, xử lý biên.
- Dùng TaskCreate/TaskUpdate để người dùng theo dõi tiến độ khi việc có từ 3 bước trở lên.

## 3. Làm

- Theo quy ước trong `CLAUDE.md`. Ưu tiên tái sử dụng hàm, class CSS, biến màu đã có.
- Logic thuần đặt trong module không đụng DOM.
- Sau mỗi bước: `node scripts/check.mjs`. Lỗi thì sửa ngay, đừng chất đống.
- Với thay đổi UI, nếu có trình duyệt hoặc công cụ chụp màn hình, hãy mở thử ở chiều rộng ~375px và ~1120px. Nếu **không** kiểm tra được trong trình duyệt, nói rõ điều đó ở báo cáo cuối, đừng khẳng định "đã chạy tốt".

## 4. Kiểm tra

Chạy skill `verify`. Sau đó chạy skill `review-changes` trên diff của chính bạn.

## 5. Commit cục bộ

- Một commit cho mỗi ý hoàn chỉnh, thông điệp mệnh lệnh ngắn bằng tiếng Anh.
- Không `git push`.

## 6. Báo cáo cuối (ngắn, bằng tiếng Việt)

Đúng 4 phần, mỗi phần 1–3 dòng:
- **Đã làm:** thay đổi người dùng nhìn thấy.
- **Đã kiểm tra:** lệnh nào đã chạy, kết quả; điều gì chưa kiểm tra được.
- **Giả định đã chọn:** để người dùng sửa nếu sai.
- **Gợi ý tiếp theo:** tối đa 3 ý, không tự làm.

## Khi nào được hỏi

Chỉ dừng lại hỏi khi:
- Thay đổi có thể làm **mất dữ liệu người dùng** (đổi `storageKey`, đổi cấu trúc dữ liệu lưu).
- Cần thêm **thư viện ngoài** hoặc **gọi mạng**.
- Hai cách hiểu yêu cầu dẫn tới kết quả hoàn toàn khác nhau và không thể làm cả hai.

Khi hỏi: nêu phương án bạn khuyên dùng kèm lý do, để người dùng chỉ cần trả lời "ok".

## Mẹo ra quyết định thay người dùng

- Mơ hồ về giao diện: chọn phương án đơn giản, hợp phong cách hiện có (nền giấy `--paper`, xanh `--green`, vàng nhấn `--gold`), đừng tự tạo phong cách mới.
- Mơ hồ về hành vi: chọn hành vi ít gây bất ngờ nhất và có thể hoàn tác.
- Mơ hồ về phạm vi: chọn phạm vi nhỏ nhất vẫn có ích.
