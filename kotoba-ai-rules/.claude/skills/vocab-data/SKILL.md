---
name: vocab-data
description: Soạn, kiểm tra hoặc chuẩn hóa danh sách từ vựng tiếng Nhật để nhập vào Kotoba (ví dụ "cho tôi 50 từ N5 chủ đề đồ ăn", đổi từ mẫu, sửa file import lỗi). Dùng khi công việc là dữ liệu từ vựng, không phải code. Vocabulary list authoring and validation.
---

# vocab-data

## Định dạng của app

Mỗi dòng: **kana | nghĩa tiếng Việt | kanji** (kanji có thể bỏ trống). Cũng chấp nhận dấu phẩy hoặc tab. Dòng đầu có thể là tiêu đề (`kana`, `hiragana`, `katakana`).

```text
つき | mặt trăng | 月
いぬ | con chó | 犬
パン | bánh mì
```

Quy tắc mà `makeWord` bắt buộc (vi phạm thì dòng bị từ chối):
- Cột kana chỉ chứa hiragana, katakana, khoảng trắng, `ー`, `・`. **Không** romaji, không kanji ở cột này.
- Nghĩa không được trống, tối đa 240 ký tự. Kana và kanji tối đa 120 ký tự.
- Nghĩa có dấu phân cách (phẩy) thì đặt trong ngoặc kép: `"ăn, dùng bữa"`.
- Tệp UTF-8, tối đa 250.000 ký tự.

## Quy trình soạn danh sách

1. Xác định chủ đề, cấp độ (N5/N4...), số lượng. Nếu người dùng không nói, chọn hợp lý (ví dụ 20–30 từ N5) và ghi rõ trong báo cáo.
2. Chỉ viết từ bạn **chắc chắn đúng** về cách đọc, chữ kanji và nghĩa. Từ nào không chắc thì bỏ, đừng đoán.
3. Nghĩa tiếng Việt: ngắn, tự nhiên, nghĩa thông dụng nhất. Từ nhiều nghĩa thì ghi 1–2 nghĩa chính trong ngoặc kép.
4. Điền kanji khi từ thường được viết bằng kanji. Từ thường viết bằng kana (ví dụ ありがとう) hoặc katakana (コーヒー) thì để trống cột kanji.
5. Không sao chép nguyên danh sách từ giáo trình hoặc trang web có bản quyền. Tự soạn từ kiến thức chung.
6. Lưu vào `data/` (ví dụ `data/n5-do-an.txt`) nếu người dùng muốn giữ lại; nếu không thì đưa trực tiếp trong câu trả lời.

## Kiểm tra bắt buộc

```sh
node scripts/validate-vocab.mjs data/ten-tep.txt
```

Script dùng đúng `parseImport` của app, báo lỗi theo số dòng, từ trùng trong file và trùng với từ mẫu. Sửa đến khi báo `✓ N từ hợp lệ` rồi mới giao cho người dùng.

## Đổi từ mẫu (`starterWords`)

- Từ mẫu nằm ở đầu `dist/words.js`. Chỉ đổi khi người dùng yêu cầu.
- Giữ id theo dạng `sample-<số>` và cấu trúc `[kana, meaning, kanji]`.
- Cập nhật README nếu số lượng từ mẫu thay đổi (README đang ghi "8 từ mẫu").
- Từ mẫu chỉ áp dụng cho người dùng **chưa có dữ liệu** trong `localStorage`; người dùng cũ sẽ không thấy thay đổi. Nhớ nêu điều này trong báo cáo.

## Báo cáo

Nêu số từ, chủ đề/cấp độ, kết quả chạy `validate-vocab.mjs`, và nhắc người dùng rà lại nghĩa trước khi dùng để học thật.
