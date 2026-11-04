---
name: verify
description: Kiểm tra thay đổi trước khi báo "xong" hoặc commit. Chạy script kiểm tra tĩnh, test, và danh sách thử tay theo từng loại thay đổi. Dùng sau mọi chỉnh sửa code. Pre-completion verification for Kotoba.
---

# verify

Không được nói "xong", "hoạt động tốt" hay "đã kiểm tra" nếu chưa chạy các bước dưới đây. Nói đúng những gì đã làm và **chưa** làm được.

## Bước 1: kiểm tra tĩnh (luôn chạy)

```sh
node scripts/check.mjs
```

Nó kiểm tra: cú pháp JS, import tương đối và tên export, tham chiếu `href`/`src` trong HTML, không có URL mạng ngoài, `storageKey` không đổi, và chạy `tests/*.test.mjs` nếu có. Còn lỗi thì sửa rồi chạy lại. Không bỏ qua cảnh báo mà không giải thích.

## Bước 2: chạy thử

```sh
python3 -m http.server 8000 --directory dist
```

Nếu repo đã đổi thư mục gốc, dùng thư mục đó. Kiểm tra server trả 200 cho `/`, `/app.js`, `/styles.css` (ví dụ `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/`). Dừng server khi xong.

Nếu có công cụ trình duyệt (built-in browser hoặc Chrome), mở trang, xem console có lỗi đỏ không, và thao tác thử. Nếu **không có** trình duyệt, ghi rõ: "chưa kiểm tra trong trình duyệt" và đưa cho người dùng danh sách thao tác để thử tay.

## Bước 3: thử tay theo loại thay đổi

**Luôn thử (hồi quy cơ bản)**
- Tải trang lần đầu: có 8 từ mẫu, không lỗi console.
- Chuyển qua 4 chế độ: Flashcard, Nghe chép, Chế độ đọc, Từ vựng.
- Thêm một từ, tải lại trang, từ vẫn còn.

**Thay đổi giao diện**
- Rộng ~375px và ~1120px: không tràn ngang, không chữ bị cắt.
- Bàn phím: Tab đi qua mọi điều khiển, thấy vòng focus, `Esc` đóng dialog.
- Chữ Nhật có `lang="ja"`.

**Thay đổi dữ liệu / lưu trữ**
- Dữ liệu cũ (không có trường mới) vẫn đọc được.
- Sửa, xóa, nhập danh sách (cả file lỗi và từ trùng) đều ổn.
- `storageKey` không đổi.

**Thay đổi audio**
- Đổi chế độ hoặc rời trang thì dừng đọc.
- Không có giọng Nhật: hiện thông báo thân thiện, không lỗi.
- Thanh tốc độ đọc vẫn hoạt động ở mọi chế độ.

## Bước 4: báo cáo kết quả

Ghi ngắn:
- Lệnh đã chạy và kết quả (đạt/không).
- Đã thử tay những gì, **chưa** thử những gì và lý do.
- Rủi ro còn lại, nếu có.
