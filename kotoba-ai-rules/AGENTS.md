# AGENTS.md

Các quy tắc đầy đủ cho mọi AI coding agent nằm trong [CLAUDE.md](./CLAUDE.md). Hãy đọc file đó trước khi sửa bất cứ thứ gì.

Tóm tắt rất ngắn:

- Dự án: web học từ vựng tiếng Nhật bằng tiếng Việt, **HTML/CSS/JS thuần** ở `frontend/`, Node.js và SQLite ở `backend/`.
- Giao diện hiển thị bằng **tiếng Việt**; code và tên biến bằng tiếng Anh.
- Không thêm thư viện ngoài, không gọi mạng, không đổi `storageKey`.
- Chạy `node scripts/check.mjs` trước khi báo xong. Không tự `git push`.
- Quy trình làm việc tự chủ: xem `.claude/skills/vibe/SKILL.md`.
