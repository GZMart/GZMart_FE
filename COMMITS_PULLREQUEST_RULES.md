## PR AND Commit Rule

# 📘 Quy tắc Commit theo chuẩn Conventional Commits

## ✅ Mục tiêu

Áp dụng chuẩn [Conventional Commits](https://www.conventionalcommits.org/) để:

- Quản lý lịch sử commit rõ ràng, có cấu trúc.
- Dễ dàng truy vết task liên quan (đặc biệt khi cần fix lỗi).
- Giúp quản lý và review code hiệu quả hơn.

---

## 🎯 Cấu trúc commit message

```
[JiraTicket_ID][Committer][UI/BE/API] Commit message [DD.MM.YYYY]
```

### 🔍 Ví dụ:

```
[FLN-4][Hoang][UI] Update header component [16.05.2025]
```

📌 _Lưu ý:_ Giúp dễ tra lại task, hỗ trợ review và tracking người xử lý.

---

## 🗂 Các loại function

| Function | Mô tả                            |
| -------- | -------------------------------- |
| `UI`     | Giao diện người dùng             |
| `BE`     | Logic, xử lý phía backend        |
| `API`    | Kết nối giữa frontend và backend |

---

## 🗂 Các loại commit

| Type       | Mô tả                                                     |
| ---------- | --------------------------------------------------------- |
| `feat`     | Thêm tính năng mới                                        |
| `fix`      | Sửa lỗi                                                   |
| `docs`     | Cập nhật tài liệu (README, Wiki, ...)                     |
| `style`    | Thay đổi định dạng code, không ảnh hưởng logic            |
| `refactor` | Cải tổ lại code, không thêm tính năng                     |
| `test`     | Thêm hoặc chỉnh sửa test                                  |
| `chore`    | Thay đổi phụ trợ như config, build, cập nhật dependencies |
| `perf`     | Cải thiện hiệu năng                                       |

---

## 🧩 Quy định bổ sung

- ✅ **Luôn tự review lại code trước khi commit.**

---

## 🌿 Quy tắc đặt tên branch

### ✔ Cấu trúc:

```
<type>/<JiraTicketID>_<screen>-<ui|be|api>
```

### 📌 Ví dụ:

- `feature/FLN-1_Login-UI`
- `feature/FLN-2_ProductDetail-BE`
- `bugfix/FLN-3_EmailSending-UI`
- `refactor/FLN-4_ApiHandler-API`

### 📎 Ghi chú:

- Giai đoạn đầu nên dùng `feature/*` cho chức năng mới.
- Có thể thêm `bugfix`, `refactor`, `hotfix` tùy nhu cầu về sau.
- Hậu tố `-UI`, `-BE`, `-API` giúp phân biệt nhanh vùng code chịu trách nhiệm.

---

## 🔀 Quy tắc tạo Pull Request (PR)

### ✅ Tiêu đề PR

```
[function][type] <mô tả ngắn gọn thay đổi>
```

#### 📌 Ví dụ:

- `[UI][feat] Add user profile screen`
- `[BE][fix] Fix email notification bug`

---

### 📄 Nội dung PR bắt buộc phải có:

1. **Overview – Mô tả tổng quan**

   - Giải thích ngắn gọn bạn đã thay đổi gì và lý do tại sao.

2. **Jira Link – Liên kết task Jira**

   - Gắn link task Jira theo mẫu:

     ```
     Jira Ticket: https://your-domain.atlassian.net/browse/PROJECT-123
     ```

3. **EVD – Evidence**

   - Chèn ảnh chụp màn hình, video hoặc output liên quan (nếu có UI thay đổi hoặc logic dễ gây bug).

---

### 🔍 Review và Merge

- Tối thiểu **1–2 reviewer** phải được assign để review.
- ❌ **Không tự ý merge** nếu chưa có approval (trừ trường hợp khẩn cấp và phải báo trước).

---

### 🧹 Sau khi merge

- Cập nhật trạng thái task tương ứng trong hệ thống Jira.

---

## ✅ Gợi ý template PR nhanh (Markdown):

```markdown
### Overview

[Giải thích ngắn gọn về thay đổi]

---

### Check list

**Checklists**

- [ ] Đã test đầy đủ trước khi tạo PR
- [ ] Đã tự review lại code
- [ ] Đảm bảo không commit các file không cần thiết (VD: `.env`, `node_modules`, build folder, v.v.)
- [ ] Đã đặt tên branch, commit theo đúng quy định
- [ ] Add Reviewers và Assignees
- [ ] Add Labels

---

### Jira Ticket

https://your-domain.atlassian.net/browse/PROJECT-123

---

### EVD

[Ảnh chụp màn hình hoặc output kết quả]
```

---
