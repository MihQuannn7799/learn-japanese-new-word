# Nguồn dữ liệu từ vựng

Kho đang dùng là **Minna Nhật–Việt: 1.929 mục trong 50 bài**, lấy từ [NhatPrv/Guga-Gangs](https://github.com/NhatPrv/Guga-Gangs), bản chụp [75d02e0](https://github.com/NhatPrv/Guga-Gangs/tree/75d02e0ca61c63796e4e5723f35d2eb5aa8871f8). Nguồn công bố [giấy phép MIT](LICENSE-MINNA-MIT.txt), Copyright © 2026 NhatPrv.

`minna-vi.json` giữ mọi mục của `data/minna-no-nihongo-n5/unit-01..25/vocabulary.json` và `data/minna-no-nihongo-n4/unit-26..50/vocabulary.json`, gồm cả cách nói giao tiếp. Mỗi mục có cách đọc, dạng viết, nghĩa Việt và câu ví dụ Nhật–Việt; âm Hán Việt được giữ khi nguồn có cung cấp. `minna-lessons.json` giữ bài và thứ tự các mục. Đây là dữ liệu học tập do cộng đồng biên soạn.

Kotoba chuẩn hóa ký hiệu tùy chọn và giữ các cách đọc/cách viết thay thế để dùng khi nghe chép. Một số lỗi đọc, dấu phân tách và đánh máy được sửa có ghi nhận trong `scripts/data/minna-corrections.json`, như 名刺, テープ và cách đọc 電話. `minna-source.json` ghi phiên bản, đường dẫn, số mục và SHA-256 của từng bài gốc; test đối chiếu số mục từng bài để tránh bỏ sót. Mục lặp giữa các bài vẫn được giữ trong kho; khi thêm vào sổ tay, app bỏ qua cách đọc/cách viết đã có.

`kanji-vi.json` được tạo từ chính kho Minna này; nghĩa gợi ý bằng tiếng Việt, nhãn N5/N4 theo nhóm bài của nguồn. Dữ liệu được đóng gói cùng app, không gọi nguồn bên ngoài khi học. Phát âm dùng giọng tiếng Nhật của trình duyệt.

`legacy-n5-vi.json` chỉ dùng nâng cấp 674 thẻ tiếng Anh của kho cũ, giữ ID/tiến độ và không thay nghĩa người dùng đã sửa. Các giá trị gốc để đối chiếu xuất phát từ [OpenJLPT 0d1d341](https://github.com/evanclan/OpenJLPT/tree/0d1d3410bec90bd4098a7c72de820543cb4f707c), theo [CC BY-SA 4.0](LICENSE-CC-BY-SA-4.0.txt); nghĩa Việt lấy từ kho mới khi khớp và được bổ sung trong `scripts/data/legacy-n5-vi.json`. OpenJLPT dựa trên Jonathan Waller, JMdict/KANJIDIC2 của EDRDG và Tatoeba; xem [thông báo nguồn OpenJLPT](https://github.com/evanclan/OpenJLPT/blob/0d1d3410bec90bd4098a7c72de820543cb4f707c/NOTICE.md).

Cách trình bày thẻ dọc, phần chữ Nhật/cách đọc/âm Hán Việt/nghĩa và câu ví dụ tham khảo [VNJPCLUB – Bài 2](https://www.vnjpclub.com/minna-no-nihongo/bai-2-tu-vung.html). Giao diện Kotoba được triển khai bằng mã riêng; nội dung từ vựng của trang này không được đóng gói trong app.

Tạo lại dữ liệu: `npm run data:import -- <thư-mục-cache> --download`; bỏ `--download` để dùng bản cache. Mã ứng dụng dùng MIT.
