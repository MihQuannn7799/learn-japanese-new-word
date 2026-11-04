---
name: deploy-pages
description: Đưa Kotoba lên GitHub Pages để có link demo, thêm workflow tự triển khai, và (tùy chọn) biến app thành PWA học offline. Dùng khi người dùng muốn "đưa lên mạng", "có link demo", "deploy". Publish the static site.
---

# deploy-pages

App là web tĩnh, không có bước build, nên triển khai rất đơn giản. **Đừng tự `git push` hoặc bật cài đặt trên GitHub**: những việc đó do người dùng làm. Việc của bạn là chuẩn bị file và hướng dẫn chính xác.

## Vì sao cần workflow

GitHub Pages kiểu "Deploy from a branch" chỉ phục vụ thư mục gốc `/` hoặc `/docs`, **không** phục vụ `dist/`. Source hiện ở `dist/`, nên dùng GitHub Actions để đăng đúng thư mục đó.

## Tạo workflow

Tạo `.github/workflows/pages.yml` (đổi `path` nếu thư mục source đã đổi):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: node scripts/check.mjs

  deploy:
    needs: check
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

Trước khi đưa cho người dùng, kiểm tra lại số phiên bản các action trên tài liệu chính thức của GitHub nếu có thể, vì phiên bản mới có thể đã ra.

## Bước người dùng cần làm (nêu rõ trong báo cáo)

1. Commit và push `.github/workflows/pages.yml` lên nhánh `main`.
2. Trên GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Vào tab **Actions** xem workflow chạy; link trang hiện ở bước deploy (dạng `https://<tên-người-dùng>.github.io/learn-japanese-new-word/`).

## Lưu ý đường dẫn

Trang được phục vụ dưới đường dẫn con (`/learn-japanese-new-word/`). Mọi tham chiếu trong `index.html` phải là **tương đối** (`./app.js`, không phải `/app.js`). `check.mjs` đã bắt lỗi file không tồn tại, nhưng hãy tự soát đường dẫn tuyệt đối khi thêm file mới.

## Sau khi có link

- Thêm link demo (và ảnh chụp màn hình nếu có) vào đầu README.
- Cân nhắc badge trạng thái workflow.

## Tùy chọn: PWA học offline

Chỉ làm khi người dùng yêu cầu. Cần:
- `manifest.webmanifest` (tên, `start_url: "./"`, màu, icon).
- `sw.js` cache các file tĩnh của app (đường dẫn tương đối, không CDN), chiến lược cache-first, đặt tên cache có phiên bản.
- Đăng ký service worker trong `main.js`/`app.js` và `<link rel="manifest">` trong `index.html`.
- Cập nhật `scripts/check.mjs` nếu cần cho phép file mới; không nới lỏng quy tắc "không URL ngoài".
- Lưu ý: khi sửa file app, phải tăng phiên bản cache, nếu không người dùng sẽ thấy bản cũ.
