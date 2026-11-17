# AGENTS.md

Các quy tắc đầy đủ cho mọi AI coding agent nằm trong [CLAUDE.md](./CLAUDE.md). Hãy đọc file đó trước khi sửa bất cứ thứ gì.

Tóm tắt rất ngắn:

- Dự án: web học từ vựng tiếng Nhật bằng tiếng Việt, **Vite + TypeScript + WanaKana** ở `frontend/src/`, Node.js/TypeScript và SQLite ở `backend/`. Kiểu dữ liệu chung ở `shared/`.
- Giao diện hiển thị bằng **tiếng Việt**; code và tên biến bằng tiếng Anh.
- Không thêm thư viện ngoài bộ công nghệ đã được yêu cầu, không gọi mạng ngoài khi chạy app, không đổi `storageKey`.
- Chạy `node scripts/check.mjs` trước khi báo xong. Không tự `git push`.
- Quy trình làm việc tự chủ: xem `.claude/skills/vibe/SKILL.md`.
