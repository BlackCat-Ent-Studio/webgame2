# Thảo luận — Triển khai apex `wanmeivn.com` trên VPS .40

**Ngày:** 2026-05-09
**Trạng thái:** Brainstorm — chờ phê duyệt trước khi lập plan
**Nguồn ngữ cảnh:** Chỉ đạo của sếp + `docs/handoff-260509-0308-wanmeivn-apex-to-vps40.md` (handoff từ team game)
**VPS đích:** `160.191.3.40` (winvps, Windows Server 2019)

> 🇬🇧 English version: `brainstorm-2026-05-09-wanmeivn-apex-deploy.md`

---

## Mục tiêu

Phục vụ `wanmeivn.com` + `www.wanmeivn.com` (website apex, hiện là bản mirror trang chủ local) từ VPS `160.191.3.40`, có HTTPS hợp lệ, **không ảnh hưởng** đến game SGJTH5 đang chạy tại `tieu3q.wanmeivn.com` trên VPS `160.191.3.13`.

Mô hình kiến trúc (theo sếp): **website apex trên .40; mỗi game trên VPS riêng**, public qua subdomain riêng.

---

## Những gì đã chốt (không bàn lại)

Đây là các ràng buộc từ sếp + handoff doc:

| # | Quyết định | Nguồn |
|---|---|---|
| 1 | `wanmeivn.com` và `www.wanmeivn.com` triển khai trên **VPS .40**. | Sếp |
| 2 | `tieu3q.wanmeivn.com` giữ nguyên trên VPS .13. **Không động vào.** | Handoff doc, sếp |
| 3 | Mỗi game (SGJTH5 hiện tại + game tương lai) chạy trên server riêng. | Sếp |
| 4 | DNS chỉ thay đổi `@` và `www`. Bản ghi A của `tieu3q` không đổi. | Handoff doc |
| 5 | Thứ tự pha: dựng site trên .40 → đổi DNS → cấp chứng chỉ → hardening. | Handoff doc |
| 6 | Team game phối hợp thời điểm đổi DNS. Sau khi đổi, họ kiểm tra phía họ. | Handoff doc |
| 7 | **Apex KHÔNG có path nào proxy vào game.** Hai trang hoàn toàn độc lập. | Chỉ đạo của sếp 2026-05-09 |
| 8 | **HSTS tại apex KHÔNG dùng `includeSubDomains`** — sẽ vi phạm nguyên tắc tách biệt. | Chỉ đạo của sếp 2026-05-09 (ngầm hiểu từ "giữ mọi thứ tách biệt") |
| 9 | **Không thiết kế tích hợp sớm.** Tính năng chéo trang sau này tính sau. | Chỉ đạo của sếp 2026-05-09 |
| 10 | **Giữ đúng phạm vi:** apex trên .40. Không động vào .13 ngoài việc phối hợp đổi DNS. | Chỉ đạo của sếp 2026-05-09 |

---

## Đã chốt bởi team (quyền được ủy quyền — có thể đảo ngược)

Người dùng đã ủy quyền team kỹ thuật quyết định những mục này vào 2026-05-09. Mỗi quyết định đều **có thể đảo ngược** — xem mục "Kế hoạch sửa / đảo ngược" bên dưới để biết chi phí undo nếu sếp chỉ đạo khác sau này.

| # | Quyết định cần đưa | Đề xuất | Phương án thay thế | Lý do đề xuất |
|---|---|---|---|---|
| 1 | **Phần mềm web server** | Caddy for Windows | IIS, nginx-Windows | File binary đơn lẻ, tự động cấp + gia hạn Let's Encrypt, redirect 1 dòng, chạy như Windows Service. IIS cần `win-acme` cho cert (script gia hạn thủ công). nginx-Windows không có auto-HTTPS. Handoff doc nói rõ: "tùy team chọn". |
| 2 | **Cách cấp chứng chỉ TLS** | HTTP-01 challenge | DNS-01 | HTTP-01 chỉ cần DNS đã trỏ về .40 (sau khi đổi DNS thì có sẵn). DNS-01 cần API của registrar dnspro.vn (nhiều khả năng không có). Handoff doc liệt kê cả hai, gợi ý sequence dùng HTTP-01. |
| 3 | **Chính sách `www`** | Redirect 301 về apex | Phục vụ cùng nội dung | Một URL chuẩn duy nhất, SEO đơn giản hơn, tránh nội dung trùng lặp. Caddy: `www.wanmeivn.com { redir https://wanmeivn.com{uri} permanent }`. Handoff doc nói: "cách nào cũng được, miễn nhất quán". |
| 4 | **HSTS** | Bật, KHÔNG `includeSubDomains` | Tắt / bật cùng `includeSubDomains` | Ép HTTPS trên apex (tốt). Loại trừ `includeSubDomains` để policy không "lan" sang `tieu3q.wanmeivn.com` (handoff doc cảnh báo rõ điểm này). |
| 5 | **Submit HSTS preload** | **Hoãn** | Submit ngay | Preload không thể đảo ngược trong ~6 tháng. Không đáng rủi ro với deploy thử nghiệm sẽ đổi thương hiệu. |
| 6 | **Chạy như Windows Service** | Có (Caddy native hoặc qua `nssm`) | Foreground / scheduled task | Sống sót sau reboot. Pattern production tiêu chuẩn. |
| 7 | **TTL DNS trước khi đổi** | Hạ TTL `@` xuống 300s vài giờ trước; khôi phục sau | Để nguyên 3600 | Rollback nhanh nếu lỗi. Best practice. |
| 8 | **Tắt `npx serve` đang chạy trên :3000** | Có, sau khi Caddy đã verify xong | Để chạy | Dư thừa khi Caddy đã phục vụ cùng nội dung trên :80/:443. |

---

## Câu hỏi mở

### Sếp đã trả lời (2026-05-09)

1. ~~Apex có path proxy vào game không?~~ → **KHÔNG.** Hai trang độc lập.
2. ~~HSTS dùng `includeSubDomains`?~~ → **KHÔNG.** Nguyên tắc tách biệt.
3. ~~Quy ước đặt tên subdomain cho game tương lai?~~ → **Hoãn.** "Tính sau."

### Còn mở — kiểm tra kỹ thuật trước khi đổi (không cần sếp duyệt)

4. **CAA records tại apex** — `wanmeivn.com` có không? Nếu có, phải cho phép Let's Encrypt cho cả issuer của .40 và renew tieu3q trên .13. Cần kiểm tra trong panel dnspro.vn trước khi cấp chứng chỉ.
5. **MX records** — handoff cảnh báo: không động đến trừ khi cũng đang chuyển mail. Ta không chuyển. Verify MX hiện trạng trước khi đổi DNS để tránh vô tình xóa trong panel.
6. **Windows Server 2019 Datacenter Evaluation hết hạn** — bản hiện tại là "Evaluation". Nếu apex sống lâu dài ở đây, vấn đề license phải báo lên người chủ hạ tầng. Ngoài phạm vi deploy này nhưng flag để mọi người thấy.

### ~~Còn mở — quyết định nhỏ~~ Đã chốt bởi team (2026-05-09)

7. ~~Chính sách `www`~~ → **301 → apex** (đã chốt).
8. ~~Lựa chọn web server / phương pháp TLS / cài Service~~ → **Caddy for Windows + HTTP-01 + chạy như Windows Service** (đã chốt tất cả).

Kế hoạch đảo ngược cho từng mục: xem phần "Kế hoạch sửa / đảo ngược" bên dưới.

---

## Sơ đồ kiến trúc (trạng thái đích)

```
                         Internet
                            │
               ┌────────────┴────────────┐
               │                         │
               ▼                         ▼
    ┌──────────────────┐        ┌──────────────────┐
    │ wanmeivn.com     │        │ tieu3q.wanmei... │
    │ www.wanmeivn.com │        │ (game SGJTH5)    │
    └────────┬─────────┘        └────────┬─────────┘
             │                           │
             ▼                           ▼
    ┌──────────────────┐        ┌──────────────────┐
    │ VPS .40 (winvps) │        │ VPS .13 (Linux)  │
    │ Windows Server   │        │ Caddy in Docker  │
    │ Caddy → mirror/  │        │ Caddy → game app │
    │ HTTPS (LE)       │        │ tieu3q :13001    │
    └──────────────────┘        └──────────────────┘
                                          │
                                  (các game tương lai
                                   mỗi game 1 VPS riêng,
                                   subdomain riêng)
```

---

## Quy trình 6 pha

### Pha 1 — Chuẩn bị trên .40 (an toàn offline; chưa ảnh hưởng DNS công khai)

1. Tải Caddy for Windows (file `caddy.exe` đơn lẻ, build chính thức).
2. Đặt tại `C:\caddy\caddy.exe`. Tạo `C:\caddy\Caddyfile`.
3. Caddyfile bản nháp ban đầu (chưa TLS — tạm để test bằng IP):
   ```
   :80 {
     root * C:\web\web1\webgame\Webgame-main\mirror
     file_server
   }
   ```
4. Mở Windows Firewall inbound: TCP 80 + TCP 443.
5. Xác nhận ACL phía cloud cũng cho phép 80 + 443 inbound (panel của nhà cung cấp).
6. Chạy `caddy.exe run` từ `C:\caddy\`. Test local: `http://localhost/` ra trang chủ.
7. Test bằng IP từ ngoài: `http://160.191.3.40/` — trang chủ phải load được.

### Pha 2 — Chuẩn bị DNS tại registrar (bạn, trong dnspro.vn)

1. Đăng nhập dnspro.vn.
2. Hạ TTL trên `@` từ 3600 → 300 (cho phép rollback nhanh).
3. Verify bản ghi A `tieu3q` vẫn trỏ về `160.191.3.13` (kiểm tra sanity).
4. Chờ ít nhất 1 giờ (qua khung TTL cũ là 1 giờ) để resolver tôn trọng TTL mới.
5. Báo team game: "Đổi DNS lúc <giờ>; tieu3q không động."

### Pha 3 — Đổi DNS (bạn, trong dnspro.vn)

1. Update bản ghi `@`: `160.191.3.13` → `160.191.3.40`.
2. Thêm bản ghi `www`: A → `160.191.3.40`.
3. **Để `tieu3q` nguyên không đổi.**
4. Save.
5. Verify từ .40 với `nslookup wanmeivn.com 8.8.8.8` sau vài phút.

### Pha 4 — Cấp chứng chỉ (tự động, trên .40)

1. Update Caddyfile sang dạng production:
   ```
   wanmeivn.com {
     root * C:\web\web1\webgame\Webgame-main\mirror
     file_server
     header Strict-Transport-Security "max-age=31536000"
   }

   www.wanmeivn.com {
     redir https://wanmeivn.com{uri} permanent
   }
   ```
2. Reload Caddy: `caddy.exe reload`.
3. Request HTTPS đầu tiên đến `https://wanmeivn.com` kích hoạt Caddy xin Let's Encrypt cert qua HTTP-01.
4. Tương tự với `https://www.wanmeivn.com`.
5. Caddy log tại `C:\caddy\caddy.log` (hoặc stdout) — theo dõi ACME success.

### Pha 5 — Verify

| Kiểm tra | Kỳ vọng |
|---|---|
| `nslookup wanmeivn.com` | 160.191.3.40 |
| `nslookup www.wanmeivn.com` | 160.191.3.40 |
| `nslookup tieu3q.wanmeivn.com` | 160.191.3.13 (không đổi) |
| `curl -I https://wanmeivn.com` | HTTP/2 200, cert hợp lệ |
| `curl -I https://www.wanmeivn.com` | HTTP 301 → `https://wanmeivn.com/` |
| Browser: `https://wanmeivn.com/` | Trang chủ load đầy đủ style, mọi CSS/ảnh trả về 200 |
| Team game kiểm tra `https://tieu3q.wanmeivn.com` | Vẫn hoạt động, login + WS handshake OK |

### Pha 6 — Hardening

1. Khôi phục TTL `@` từ 300 về lại 3600 trong dnspro.vn.
2. Cài Caddy như một Windows Service:
   - `caddy.exe install` (nếu build hỗ trợ) hoặc `nssm install Caddy "C:\caddy\caddy.exe" run --config C:\caddy\Caddyfile`.
   - Đặt service auto-start.
3. Tắt task `npx serve` trên :3000 (không cần nữa).
4. Xác nhận Caddy sống sót sau reboot bằng `Restart-Computer` rồi verify lại Pha 5.

---

## Bảng rủi ro

| Rủi ro | Khả năng | Tác động | Giảm thiểu |
|---|---|---|---|
| DNS lan truyền chậm → user thấy site cũ | Trung bình | Thấp | TTL hạ xuống 300 trước; đổi vào giờ ít traffic |
| Bị Let's Encrypt rate-limit | Thấp | Trung bình | Caddy tự xử lý; nếu trúng, chờ 1h. Cấp lần đầu phải sạch — handoff xác nhận .13 chưa từng xin cert apex. |
| Cloud provider chặn port 80 inbound | Thấp | Cao (cấp cert fail) | Verify trong panel trước khi đổi. Nếu chặn, chuyển sang DNS-01 (cần API registrar). |
| `tieu3q` bị vô tình sửa khi đổi DNS | Thấp | Cao (game offline) | Hai người kiểm tra diff dnspro.vn trước khi save |
| Caddy crash đêm, không tự khởi động | Trung bình | Cao | Pha 6 bắt buộc cài Windows Service + test reboot |
| HSTS cấu hình sai, khóa user khỏi HTTP fallback | Thấp | Trung bình | Test apex không HSTS trước (Pha 4); chỉ bật header sau khi Pha 5 pass |
| MX records vô tình bị xóa trong UI dnspro.vn | Thấp | Cao (mất mail nếu có) | Screenshot panel DNS trước khi save |
| Windows Eval edition hết hạn | Chắc chắn (sớm muộn) | Cao | Vấn đề license báo lên ops/owner; lên lịch trước mốc 180 ngày |

---

## Kế hoạch sửa / đảo ngược

Đây là các *quyết định ủy quyền* — đã được team chốt, nhưng người dùng yêu cầu rõ ràng về đường lui nếu sếp chỉ đạo khác sau này. Mọi lựa chọn dưới đây đều có thể undo mà không mất state DNS, không mất cert (hoặc chỉ phải reissue sạch), và downtime không quá ~10 phút.

### Quyết định 1 — Chính sách `www`: 301 → apex

**Nếu sếp muốn cùng nội dung trên www:**
- Sửa `C:\caddy\Caddyfile`. Thay block `www.wanmeivn.com { redir ... }` bằng nội dung `root` + `file_server` giống block apex.
- `caddy.exe reload` (~1 giây; không downtime).
- DNS, cert, firewall — không thay đổi.
- **Thời gian đảo ngược:** ~5 phút.
- **Rủi ro mất dữ liệu:** không.

### Quyết định 2 — Web server: Caddy

**Nếu sếp muốn IIS:**
- Cài IIS Server-Manager feature (`Install-WindowsFeature -name Web-Server -IncludeManagementTools`).
- Tạo site trỏ vào `mirror/`, bind 80 + 443.
- Cài `win-acme` để xin cert Let's Encrypt (thủ công). Cert do Caddy cấp có thể export ra PFX rồi import vào IIS để khỏi reissue, HOẶC để win-acme cấp cert mới (sạch).
- Chuyển redirect: thay `redir` của Caddy bằng IIS URL Rewrite module rules.
- Stop Caddy service trước khi bind IIS vào :80/:443.
- **Thời gian đảo ngược:** 1–2 giờ.
- **Rủi ro mất dữ liệu:** không nếu export PFX trước; nếu không thì cấp LE mới (vẫn trong rate limit).

**Nếu sếp muốn nginx for Windows:**
- Tải nginx-Windows build.
- Viết `nginx.conf` chuyển dịch rule từ Caddyfile. Lưu ý: nginx-Windows không có auto-HTTPS — phải cài `win-acme` riêng cho cert + scheduled-task gia hạn.
- Stop Caddy service trước khi bind nginx vào :80/:443.
- **Thời gian đảo ngược:** 30–60 phút.
- **Rủi ro mất dữ liệu:** như trên.

**Lưu ý về cert-portability:** Caddy lưu Let's Encrypt account + private key tại `C:\Users\Administrator\AppData\Roaming\Caddy\` — backup folder này trước khi swap để giữ tính liên tục.

### Quyết định 3 — TLS method: HTTP-01

**Nếu HTTP-01 fail (cloud chặn port 80) hoặc sếp muốn DNS-01:**
- Caddy hỗ trợ DNS-01 qua plugin. dnspro.vn nhiều khả năng không có plugin Caddy chính thức — cần verify.
- Nếu không có plugin: cách dễ nhất là migrate DNS hosting sang Cloudflare (free, có plugin Caddy). Đổi nameserver tại registrar; tạo lại DNS records trong panel Cloudflare.
- Caddyfile đổi: thêm block `tls { dns cloudflare {env.CF_API_TOKEN} }`.
- **Thời gian đảo ngược:** 30 phút nếu plugin dnspro tồn tại; ~1 ngày nếu phải migrate Cloudflare (đa số là chờ propagation).
- **Rủi ro mất dữ liệu:** không (DNS records tạo lại từ screenshot; cert hiện tại vẫn hoạt động đến lần renewal kế).

### Quyết định 4 — Process model: Windows Service

**Nếu cài service gây lỗi (hiếm, nhưng Windows có thể khó tính):**
- `nssm stop Caddy && nssm remove Caddy confirm` (hoặc `caddy.exe stop` + remove service).
- Thay bằng Task Scheduler task: trigger "At system startup", chạy với SYSTEM account, action = `caddy.exe run --config C:\caddy\Caddyfile`.
- Hoặc đơn giản chạy foreground qua PowerShell với `Start-Process -WindowStyle Hidden`.
- **Thời gian đảo ngược:** 5–10 phút.
- **Rủi ro mất dữ liệu:** không.

### Lưu ý chung về tính đảo ngược

**Việc đổi DNS bản thân nó là hành động đắt nhất để rollback**, không phải 4 quyết định locked ở trên. Rollback đổi DNS được tài liệu hóa riêng ở dưới ("Kế hoạch rollback"). Nếu team cần undo *toàn bộ* và quay về trạng thái trước deploy, đường đi là: đảo DNS tại dnspro.vn → stop Caddy trên .40 → đóng firewall port 80/443. Tổng: ~10 phút + thời gian propagation (5 phút với TTL=300).

---

## Kế hoạch rollback (nếu có sự cố trong/sau khi đổi)

1. **Rollback DNS:** trong dnspro.vn, đổi `@` về `160.191.3.13`. Xóa bản ghi A mới `www`. Với TTL=300, lan truyền = 5 phút.
2. Team game verify `tieu3q.wanmeivn.com` vẫn hoạt động (phải còn — chưa hề đổi).
3. Apex quay về trạng thái trước deploy (404 mặc định từ Caddy của .13).
4. Điều tra nguyên nhân trên .40 mà không bị áp lực thời gian.

---

## Caddyfile (bản tham chiếu cuối)

```caddyfile
{
    # Block global (tùy chọn)
    email ops@wanmeivn.com   # placeholder — thay bằng contact ops thật cho ACME
}

wanmeivn.com {
    root * C:\web\web1\webgame\Webgame-main\mirror
    file_server
    encode gzip zstd
    header {
        Strict-Transport-Security "max-age=31536000"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    log {
        output file C:\caddy\logs\wanmeivn.log
    }
}

www.wanmeivn.com {
    redir https://wanmeivn.com{uri} permanent
}
```

---

## Tiêu chí thành công

- `https://wanmeivn.com` trả HTTP 200 với cert Let's Encrypt hợp lệ và trang chủ hiển thị đầy đủ.
- `https://www.wanmeivn.com` trả 301 về apex.
- `https://tieu3q.wanmeivn.com` tiếp tục hoạt động không có thay đổi nhìn thấy được phía team game.
- Caddy trên .40 sống sót sau reboot (Windows Service active, auto-start).
- 8 mục verify ở Pha 5 đều pass.
- Plan rollback đã được test (ít nhất là test lý thuyết — không bắt buộc thực thi).

---

## Bước tiếp theo (sau khi brainstorm này được duyệt)

Sinh plan MD: `plans/{date}-wanmeivn-apex-deploy/plan.md` cộng các phase file theo cấu trúc plan của project (mỗi pha 1–6 ở trên thành 1 file phase).

Việc tạo plan sẽ trigger qua `/ck:plan` sau khi sếp/owner đã duyệt các đề xuất ở phần "Cần thảo luận".
