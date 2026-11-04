# Nguồn dữ liệu từ vựng

`n5.json` và `kanji.json` là dữ liệu phái sinh từ [OpenJLPT](https://github.com/evanclan/OpenJLPT), bản chụp [0d1d341](https://github.com/evanclan/OpenJLPT/tree/0d1d3410bec90bd4098a7c72de820543cb4f707c), theo [CC BY-SA 4.0](LICENSE-CC-BY-SA-4.0.txt). Giấy phép này áp dụng cho dữ liệu. Mã ứng dụng dùng giấy phép MIT.

OpenJLPT dựa trên [danh sách JLPT của Jonathan Waller](https://www.tanos.co.uk/jlpt/), [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html) và [KANJIDIC2](https://www.edrdg.org/wiki/KANJIDIC_Project.html) của EDRDG, cùng [Tatoeba](https://tatoeba.org). Xem [thông báo nguồn của OpenJLPT](https://github.com/evanclan/OpenJLPT/blob/0d1d3410bec90bd4098a7c72de820543cb4f707c/NOTICE.md).

Kotoba giữ kana, dạng viết có kanji và nghĩa tiếng Anh trong 674 mục N5, bỏ câu ví dụ và các trường không sử dụng. Chỉ mục tra cứu tổng hợp các dạng viết có kanji theo cách đọc từ N5 đến N1. Đây là phân cấp tham khảo của cộng đồng. Có thể tạo lại hai tệp bằng `node scripts/import-openjlpt.mjs <OpenJLPT/data/json/vocab>`.
