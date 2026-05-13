# Thảo luận — Lựa chọn máy chủ chạy `wanmeivn.com`: VPS .13 hay VPS .40

**Ngày:** 2026-05-09
**Trạng thái:** Cần quyết định (đang chờ chọn phương án)
**Tên miền:** `wanmeivn.com` (đã đăng ký, DNS quản lý qua dnspro.vn)
**Trang cần triển khai:** Bản mirror (sao chép) trang chủ `games.wanmei.com` (Stage 1, ~8 MB file tĩnh trong thư mục `mirror/`)
**Đối tượng người xem:** Nội bộ — chỉ vài người tester. Toàn bộ thương hiệu/nội dung sẽ được thay đổi trước khi ra mắt công khai.

> 🇬🇧 English version: xem file `brainstorm-2026-05-09-wanmeivn-hosting-decision.md` cùng thư mục.

---

## Tóm tắt nhanh (TL;DR)

Hiện có 2 VPS trong cùng một datacenter. Một máy đang có file dự án; máy còn lại đã có sẵn web server và đang là đích của tên miền. Hiện tại chưa thể truy cập cả hai máy. **Có 3 phương án khả thi; cần chọn 1.**

| | Phương án A — Chuyển tên miền gốc sang .40 | Phương án B — Thêm subdomain trên .40 | Phương án C — Tìm SSH của .13 và triển khai tại đó |
|---|---|---|---|
| Rủi ro với site đang chạy trên .13 | Site cũ sẽ tắt | Không có rủi ro | Thấp (nếu cẩn thận khi sửa Caddyfile) |
| Cần thêm thông tin đăng nhập? | Không (đã có panel DNS) | Không (đã có panel DNS) | Cần SSH user/host/key cho .13 |
| Thời gian triển khai | ~15 phút | ~15 phút | Phụ thuộc khi nào tìm được SSH |
| Khuyến nghị? | Chỉ khi site trên .13 có thể bỏ đi | **Có — an toàn và nhanh nhất** | Chỉ khi tên miền gốc bắt buộc phải ở trên .13 |

**Đề xuất: Phương án B.** Sạch sẽ nhất, không ảnh hưởng đến .13, không phải chờ thông tin đăng nhập.

---

## Bối cảnh

Người dùng có 1 tên miền (`wanmeivn.com`) và 2 VPS đặt tại Việt Nam:

```
                                wanmeivn.com (DNS tại dnspro.vn)
                                          │
                          ┌───────────────┴───────────────┐
                          │                               │
                          ▼                               ▼
                  VPS 160.191.3.13                VPS 160.191.3.40
                  (máy "công khai")                (máy "phát triển")
                  Linux, đang chạy Caddy           Windows Server 2019
                  Mở port 22/80/443                Chỉ mở port 3000
                  Đã có HTTPS redirect             npx serve đang chạy
                  DNS gốc @ trỏ về đây             Source code dự án ở đây
                  Không có thông tin SSH           Có quyền admin đầy đủ
                  Đang phục vụ một site nào đó     Chưa cài web server
```

Kết quả thăm dò từ .40 (máy hiện tại) sang .13:
- Ping: < 1 ms (cùng datacenter)
- Port 22 (SSH): mở, nhưng không có thông tin đăng nhập
- Port 80: trả về `308 → https://wanmeivn.com/` với `Server: Caddy`
- Port 443: mở, HTTPS hoạt động bình thường (trình duyệt thật truy cập được)

**Kết luận:** Máy .13 đã được cấu hình sẵn từ trước — có thể do nhà cung cấp hosting hoặc người setup lúc đầu — nhưng mật khẩu/key SSH không được lưu lại.

---

## Hiện trạng

| Hạng mục | Tình trạng |
|---|---|
| File dự án (`mirror/`) | Chỉ có trên .40 |
| Web server công khai | Chỉ chạy trên .13 |
| Chứng chỉ TLS cho `wanmeivn.com` | Đã có sẵn trên .13 (Caddy tự cấp) |
| DNS A `@` (`wanmeivn.com`) | → 160.191.3.13 |
| DNS A `tieu3q` | → 160.191.3.13 |
| Web có thể truy cập trên .40 | Không (chỉ có port `:3000` đang lắng nghe nội bộ, chưa mở firewall) |
| Quyền truy cập panel dnspro.vn | Có thông tin đăng nhập |
| SSH vào .13 | Không có |
| Quyền admin trên .40 | Có |

---

## Chi tiết 3 phương án

### Phương án A — Chuyển tên miền gốc về .40

**Các bước thực hiện:**
1. Đăng nhập dnspro.vn, đổi bản ghi A `@`: `160.191.3.13 → 160.191.3.40`.
2. Cài Caddy trên .40 (file binary đơn lẻ, có sẵn bản Windows native).
3. Mở firewall Windows port 80 + 443 cho kết nối đến.
4. Caddyfile trỏ vào `C:\web\web1\webgame\Webgame-main\mirror\`.
5. Caddy tự cấp chứng chỉ Let's Encrypt cho `wanmeivn.com` sau khi DNS lan truyền.

**Ưu điểm:**
- Chỉ một VPS (.40) chứa tất cả: source + site đang chạy.
- Không phụ thuộc vào .13 (máy ta chưa kiểm soát hoàn toàn).
- Cập nhật về sau: chỉ cần copy file vào `mirror/`, không cần đổi DNS nữa.

**Nhược điểm:**
- Bất cứ thứ gì đang chạy trên .13 tại `wanmeivn.com` **sẽ tắt ngay** sau khi DNS lan truyền. Nếu đó là một thứ quan trọng đã bị quên, đây là rủi ro lớn.
- DNS lan truyền có thể mất 15 phút đến 1 giờ với TTL 3600.
- HTTPS sẽ chưa hoạt động trong ~5 phút sau khi đổi (Caddy cần xác thực qua DNS để cấp chứng chỉ ACME).

**Khi nào nên chọn:** Khi sếp xác nhận nội dung hiện tại trên .13 có thể bỏ / chỉ là placeholder.

---

### Phương án B — Subdomain trên .40, không đụng đến .13 (khuyến nghị)

**Các bước thực hiện:**
1. Đăng nhập dnspro.vn, **thêm** bản ghi A mới (ví dụ): `homepage` → `160.191.3.40`. Bản ghi gốc `@` và `tieu3q` giữ nguyên.
2. Cài Caddy trên .40.
3. Mở firewall Windows port 80 + 443 cho kết nối đến trên .40.
4. Caddy phục vụ `homepage.wanmeivn.com` từ thư mục `mirror/`.
5. Caddy tự cấp chứng chỉ Let's Encrypt cho `homepage.wanmeivn.com`.

**Ưu điểm:**
- **Không có rủi ro** với những gì đang chạy trên .13.
- Chỉ dùng những thông tin đăng nhập hiện đã có (panel DNS + admin .40).
- Có thể hoàn tác: xóa bản ghi subdomain bất cứ lúc nào.
- Cùng tồn tại với kế hoạch tương lai cho tên miền gốc.

**Nhược điểm:**
- Hai máy chủ cùng hoạt động lâu dài — team cần nhớ rằng .13 là một hệ thống độc lập.
- Site nằm ở subdomain (ví dụ `https://homepage.wanmeivn.com`), không phải tên miền trần. Vấn đề chỉ về thẩm mỹ.

**Khi nào nên chọn:** Mặc định. Đây là phương án ít rủi ro nhất, dùng đúng những gì ta đang có.

---

### Phương án C — Lấy SSH của .13, triển khai tại đó

**Các bước thực hiện:**
1. Người dùng tìm thông tin đăng nhập SSH cho 160.191.3.13 (panel nhà cung cấp, password manager, ghi chú lúc setup ban đầu).
2. Từ .40, SSH vào .13.
3. Kiểm tra Caddyfile hiện tại và xem đang phục vụ gì tại `wanmeivn.com`.
4. Thêm một block server mới (thường là subdomain) trỏ vào thư mục mới.
5. `scp` hoặc `rsync` thư mục `mirror/` từ .40 → .13.
6. Reload Caddy.

**Ưu điểm:**
- Site nằm đúng nơi tên miền đang trỏ — không cần đổi DNS, không cần cấp chứng chỉ mới.
- Tận dụng hạ tầng TLS đã có sẵn.

**Nhược điểm:**
- **Bị chặn vì thiếu thông tin đăng nhập.** Có thể chỉ mất 5 phút (nếu creds có trong password manager) hoặc rất lâu (nếu không ai nhớ).
- Có rủi ro làm hỏng setup hiện tại trên .13 nếu sửa Caddyfile không cẩn thận.
- Phải hiểu .13 đang chạy gì trước khi đụng vào.

**Khi nào nên chọn:** Khi sếp khẳng định site phải nằm trên .13, VÀ có thể cung cấp được SSH credentials.

---

## So sánh rủi ro

| Rủi ro | Phương án A | Phương án B | Phương án C |
|---|---|---|---|
| Site cũ trên .13 bị tắt | Cao (ngay lập tức) | Không | Thấp (nếu cẩn thận) |
| Cấp chứng chỉ thất bại lần đầu | Trung bình | Trung bình | Không (chứng chỉ đã có) |
| DNS lan truyền chậm ảnh hưởng người dùng | Có (~15 phút – 1 giờ) | Có (~15 phút – 1 giờ, chỉ subdomain mới) | Không |
| Bị chặn vì thiếu thông tin đăng nhập | Không | Không | Cao |
| Quy trình dev về sau phức tạp | Thấp (1 máy) | Thấp – Trung bình (2 máy) | Trung bình (đẩy file từ .40 sang .13) |

---

## Chi phí

Cả 3 phương án: **0 đồng phát sinh.** Cả 2 VPS đã có sẵn. Caddy và Let's Encrypt đều miễn phí. Không tốn CDN/cloud.

---

## Quyết định cần đưa ra

Sếp cần chọn 1 trong 3:

1. **Phương án B (Khuyến nghị).** Triển khai subdomain trên .40. Không rủi ro, nhanh nhất với thông tin đăng nhập hiện có. Chọn tên subdomain: `homepage` / `test` / `demo` / `staging` / khác.
2. **Phương án A.** Chuyển tên miền gốc sang .40. Sếp xác nhận: *"site hiện tại trên .13 tại wanmeivn.com có thể bỏ và có thể bị tắt."*
3. **Phương án C.** Hoãn triển khai cho đến khi có SSH credentials cho .13. Sếp cung cấp ETA và nguồn lấy creds.

Nếu chọn **Phương án B**, xác nhận thêm:
- Tên subdomain (gợi ý mặc định: `homepage.wanmeivn.com`).
- Cho phép cài Caddy như một service trên VPS Windows .40.
- Cho phép mở Windows Firewall port 80 + 443 (inbound).

---

## Câu hỏi còn bỏ ngỏ

1. Hiện `https://wanmeivn.com/` trên .13 đang phục vụ nội dung gì? (Không xác định được nếu không có SSH hoặc có người mở trình duyệt thật để xem — TLS handshake từ máy Windows này hỏng cục bộ.)
2. Ai là người đã setup Caddy trên .13 ban đầu? Người đó nhiều khả năng có SSH credentials.
3. Có kế hoạch dài hạn nào cho `wanmeivn.com` (ra mắt thật, đổi thương hiệu, v.v.) ảnh hưởng đến việc nên gom về máy nào không?
4. Có cần review pháp lý/tuân thủ trước khi DNS công khai trỏ một bản clone trang chủ Wanmei về một tên có yếu tố Việt Nam không? (Đã đánh dấu trước đó; người dùng xác nhận sẽ đổi thương hiệu trước khi ra mắt.)

---

## Phụ lục — Cách xác minh sau khi triển khai (mọi phương án)

```
# DNS phân giải đúng IP
nslookup <hostname-đã-chọn>

# HTTPS truy cập được, chứng chỉ hợp lệ
curl -I https://<hostname-đã-chọn>/

# Trang chủ load đầy đủ asset (không có lỗi 404 trong Network tab)
# Mở https://<hostname-đã-chọn>/ trên trình duyệt, kiểm tra Network tab của DevTools
```

Thành công = HTTP 200 ở root, tất cả CSS/ảnh trả về 200, trang hiển thị giống hệt bản mirror local tại `http://localhost:3000`.
