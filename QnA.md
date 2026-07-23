
## Q&A

### Vì sao app này an toàn?

App được thiết kế với nguyên tắc **read-only** cho remote access, bảo vệ ở 7 lớp:

| # | Lớp bảo vệ | Cơ chế |
|---|---|---|
| 1 | **Network** | Server chỉ bind `127.0.0.1` — không thể truy cập từ máy khác trong mạng LAN |
| 2 | **Route** | `POST /api/log/clear` trả về `403 Forbidden` khi source mode là `remote` |
| 3 | **Source code** | `RemoteSlingLogSource.clearFile()` luôn throw error — không implement write |
| 4 | **Path sanitization** | `resolveLogPath()` strip toàn bộ `..`, từ chối filename bị thay đổi sau khi sanitize |
| 5 | **Config sanitization** | `logPath` từ client bị strip traversal và absolute prefix trước khi lưu |
| 6 | **Credentials** | Password chỉ tồn tại trong RAM của server — không bao giờ trả về client, không ghi xuống `localStorage` hay disk. Basic Auth dùng `Authorization` header, không bao giờ nằm trong URL |
| 7 | **UI guard** | Nút "Clear file" bị ẩn khi đang ở remote mode |

**Tóm lại:** Không có code path nào từ UI → server → AEM có thể gây ra write operation. App này không thể xóa, sửa, hay tạo file trên AEM.

### Tốn bao nhiêu RAM khi chạy local?

Rất nhẹ — đây là một Express server đơn giản, không database, không cache lớn:

| Thành phần | RAM ước tính |
|---|---|
| Node.js runtime baseline | ~35–50 MB |
| Express + WebSocket server | ~15–20 MB |
| React SPA (Vite dev hoặc static build) | Chạy trên browser của người dùng, không tốn server RAM |
| Mỗi log file đang mở (text trong memory) | ~2–5 MB (với file ~10MB) |
| **Tổng (3 file đang mở)** | **~70–90 MB** |
| **Tổng (idle, không mở file)** | **~50–60 MB** |

> **Ghi chú:** Virtual scrolling (`@tanstack/react-virtual`) chỉ render ~20-30 dòng visible trong DOM. RAM phía browser cũng rất thấp, không phụ thuộc vào kích thước file log.

### Remote AEM — 8 tiếng liên tục tốn bao nhiêu request?

**Công thức tính:**

```
Request rate  = 1 request / 2.5 giây = 0.4 req/s = 24 req/phút = 1,440 req/giờ
1 file × 8h   = 1,440 × 8 = 11,520 requests
3 files × 8h  = 11,520 × 3 = 34,560 requests
```

| Kịch bản | Số request / 8h |
|---|---|
| 1 developer × 1 file | **11,520** |
| 1 developer × 3 files | **34,560** |
| 8 developers × 3 files | **276,480** |

### 8 developers cùng dùng — UAT có bị ảnh hưởng không?

**TL;DR: Gần như không ảnh hưởng.**

Phân tích chi tiết:

**1. Tần suất request rất thấp**

```
8 devs × 3 files × 0.4 req/s = 9.6 req/s tổng cộng
```

9.6 request/giây là con số rất nhỏ với một AEM instance. Để so sánh:
- Một lần load trang AEM Sites/Assets: ~50-200 requests
- Một tác giả đang edit content: ~10-30 req/s
- `tailer.txt` rất nhẹ — chỉ trả về text, không render page, không query JCR

**2. `tailer.txt` là servlet đơn giản**

`/system/console/slinglog/tailer.txt` chỉ đọc file log từ disk và trả về dạng text. Không query database, không tạo session, không trigger workflow. Chi phí mỗi request ≈ đọc vài KB từ filesystem.

**3. Không có session accumulation**

Mỗi request là một HTTP call độc lập với Basic Auth — không tạo JCR session, không giữ session pool. AEM xử lý và giải phóng ngay.

**4. So sánh với ngưỡng an toàn**

| Chỉ số | Giá trị |
|---|---|
| Request/giây của 8 devs | **~10 req/s** |
| Ngưỡng AEM bắt đầu có dấu hiệu tải | ~100-200 req/s (tuỳ instance size) |
| Tỉ lệ sử dụng | **~5-10% ngưỡng** |

**5. Có vi phạm gì không?**

- **Adobe licensing**: Không. Đây là HTTP request thông thường đến Web Console — không khác gì developer mở browser xem log. Không vi phạm SLA hay license.
- **Security policy**: Tuỳ công ty. Nên dùng **service account** thay vì personal account để tránh bị khóa khi đổi password. Nếu công ty có policy "không tự động poll production", thì chỉ dùng cho UAT/DEV.
- **Rate limiting**: AEM không có rate limit mặc định cho `/system/console`. Tuy nhiên, nếu có WAF/reverse proxy phía trước, 10 req/s sẽ không trigger rate limit thông thường (thường set ở mức 100-1000 req/s).

> **Khuyến nghị:** Tạo một **technical user / service account** trong AEM chỉ có quyền đọc Web Console. Dùng account này cho app. Như vậy:
> - Không lộ password cá nhân của developer
> - Không bị khóa account khi developer đổi password
> - Dễ audit — tất cả request từ app đều mang danh tính service account
