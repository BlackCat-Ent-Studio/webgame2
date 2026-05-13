---
type: deployment-walkthrough
date: 2026-05-09
status: live (chờ test reboot)
audience: kỹ sư + sếp
domain: wanmeivn.com
host: 160.191.3.40 (winvps)
---

# Báo cáo triển khai — Apex `wanmeivn.com` trên VPS .40

**Mục đích:** ghi lại đầy đủ những gì đã làm, công cụ đã dùng, các quyết định đã đưa ra, và các cảnh báo/ghi chú trong quá trình triển khai. Viết để cả kỹ sư lẫn người không chuyên kỹ thuật đều theo dõi được.

> 🇬🇧 English version: `report-260509-1504-wanmeivn-deployment-walkthrough.md`

---

## Tóm tắt nhanh — đang chạy gì

| URL | Hành vi | Chứng chỉ |
|---|---|---|
| `https://wanmeivn.com` | 200, trang chủ mirror đầy đủ | Let's Encrypt, hết hạn 2026-08-07 |
| `https://www.wanmeivn.com` | 301 → apex | Let's Encrypt |
| `http://wanmeivn.com` | 308 → HTTPS | n/a |
| `https://tieu3q.wanmeivn.com` | không thay đổi, do team game phục vụ trên .13 | chứng chỉ của team game |

Web server: **Caddy v2.11.2** chạy với quyền **SYSTEM** qua **Windows Task Scheduler** (task tên `Caddy`, tự động khởi động khi boot).

---

## Bối cảnh

Project webgame chứa bản mirror trang chủ `games.wanmei.com` chính xác từng pixel. Sếp muốn host trang này công khai dưới tên miền (mới mua) `wanmeivn.com` để tester nội bộ kiểm tra, theo nguyên tắc kiến trúc: **apex chứa website; mỗi game chạy trên VPS riêng** (game SGJTH5 đã có trên VPS `.13` tại `tieu3q.wanmeivn.com`). Hai trang phải **hoàn toàn độc lập** — không có path proxy giữa apex và game.

## Các quyết định (và ai quyết)

### Sếp quyết

| # | Quyết định | Khi nào |
|---|---|---|
| 1 | Apex `wanmeivn.com` triển khai trên VPS `.40`. | Sếp chỉ đạo sau khi xem các phương án brainstorm |
| 2 | `tieu3q.wanmeivn.com` giữ nguyên trên VPS `.13`. Không động vào. | Handoff doc + sếp |
| 3 | Mỗi game chạy trên server riêng (mô hình kiến trúc). | Sếp chỉ đạo |
| 4 | Hai trang hoàn toàn độc lập — không có path proxy giữa apex và game. | Sếp chỉ đạo 2026-05-09 |
| 5 | HSTS trên apex KHÔNG dùng `includeSubDomains` (nguyên tắc tách biệt). | Sếp chỉ đạo 2026-05-09 |
| 6 | Tích hợp chéo trang sau này hoãn ("tính sau"). | Sếp chỉ đạo 2026-05-09 |

### Ủy quyền cho team kỹ thuật (có thể đảo ngược)

| # | Quyết định | Lựa chọn |
|---|---|---|
| 7 | Phần mềm web server | Caddy for Windows |
| 8 | Phương pháp cấp TLS | Dự kiến HTTP-01; Caddy tự chọn TLS-ALPN-01 (đều OK) |
| 9 | Chính sách `www` | 301 → apex |
| 10 | Mô hình process | Tự động khởi động khi boot qua Windows Task Scheduler (do nssm.cc không vào được) |

Kế hoạch đảo ngược cho từng quyết định đã được ghi tại `plans/reports/brainstorm-2026-05-09-wanmeivn-apex-deploy-vi.md`.

## Trạng thái trước triển khai

VPS `.40` (máy Windows Server 2019 hiện tại):
- 2× Xeon E5-2696 v4, 8 GB RAM, còn 41.7 GB ổ
- Chưa cài web server (không có IIS, không có Caddy)
- `npx serve` từ làm việc dev trước đó vẫn chạy trên port 3000
- Folder mirror tại `C:\web\web1\webgame\Webgame-main\mirror\` — ban đầu thiếu CSS/ảnh (đã chạy lại `mirror-wanmei-homepage.mjs` đầu session để fetch lại ~8 MB asset)
- Firewall: port 80/443 chưa bind; rule `Cauca-80` đã có sẵn cho phép inbound :80

VPS `.13` (máy Linux/Caddy của team game):
- Caddy in Docker, phục vụ `tieu3q.wanmeivn.com` qua reverse proxy port 13001
- Không có block apex `wanmeivn.com` (apex 404 ở đây trước khi ta đổi DNS)

DNS tại registrar (`dnspro.vn`) ban đầu trỏ apex `@` → `.13`; khi quay lại verify thì đã thấy trỏ về `.40` (ai đó — sếp/user/team — đã đổi DNS trước).

## Các pha (thực sự đã làm gì)

### Pha 1 — Cài Caddy trên .40 + test bằng IP

**Công cụ:**
- PowerShell `Invoke-WebRequest` để tải Caddy v2.11.2 từ GitHub releases
- PowerShell `Expand-Archive` để giải nén
- PowerShell `New-NetFirewallRule` để mở inbound :80 và :443
- Bash `caddy.exe run` (background) để chạy Caddy

**Đã làm:**
1. Tải `caddy_2.11.2_windows_amd64.zip` (17 MB) từ GitHub.
2. Giải nén `caddy.exe` (48 MB) ra `C:\caddy\caddy.exe`.
3. Viết `C:\caddy\Caddyfile` ban đầu (chỉ port 80, phục vụ `mirror/`, gzip+zstd).
4. `caddy validate` — OK.
5. Tạo firewall rule `Caddy-HTTP` (TCP 80) và `Caddy-HTTPS` (TCP 443).
6. Chạy Caddy ở background.
7. Test local: `http://localhost/` → 200, 48 KB.
8. Test qua IP công khai (loopback về .40): `http://160.191.3.40/` → 200, 48 KB.
9. Spot check asset: `yy2103.css` 200, `nav-logo.png` 200.

**Kỹ sư đã nói với người dùng:**
> "Pha 1 xong phía tôi — nhưng cần bạn xác nhận khả năng truy cập từ ngoài. Mở `http://160.191.3.40/` từ điện thoại hoặc laptop (KHÔNG phải VPS này). Nếu không load, có thể nhà cung cấp cloud chặn port 80 inbound ở edge của họ."

**Người dùng xác nhận:** truy cập từ ngoài OK.

### Pha 2 + 3 — Chuẩn bị DNS + Đổi DNS

**Phát hiện:** khi truy vấn DNS sau Pha 1, `wanmeivn.com` và `www.wanmeivn.com` đã trỏ về `.40` rồi. Người dùng (hoặc sếp/team) đã đổi DNS trong lúc "test phase 1". TTL là 3600 (chưa hạ trước để có cửa sổ rollback nhanh), CAA chưa được kiểm tra trước.

**Công cụ:** PowerShell `Resolve-DnsName`, bash `nslookup`, `curl` với nhiều resolver.

**Đã verify:**
- Apex → `.40` (3 resolver 8.8.8.8, 1.1.1.1, 9.9.9.9 đều thống nhất)
- `www` → `.40`
- `tieu3q` → `.13` (không đổi, tốt)
- HTTP qua hostname trả về trang mirror

**Rủi ro chấp nhận:** TTL=3600 nghĩa là rollback có thể mất tới 1h lan truyền. Chấp nhận được vì (a) apex trước đây không sử dụng (chỉ 404 trên `.13`), và (b) người dùng xác nhận đi tiếp.

**Ghi chú đã nói:** "DNS đã ở trạng thái đích — Pha 2-3 coi như xong. Sang thẳng Pha 4 (HTTPS go-live), nhưng tôi sẽ backup Caddyfile hiện tại để có thể hoàn nguyên trong <30 giây nếu lỗi."

### Pha 4 — Cấp chứng chỉ + Caddyfile production

**Công cụ:** `caddy validate`, `caddy reload` (qua admin endpoint local trên :2019), ACME client tích hợp của Caddy, Let's Encrypt.

**Đã làm:**
1. Backup Caddyfile port-80 ra `C:\caddy\Caddyfile.phase1.bak`.
2. Viết `C:\caddy\Caddyfile` production:
   - Block global `email` cho ACME contact (dùng `tringuyen14071992@gmail.com` — email kỹ sư có trong session context).
   - `wanmeivn.com { root, file_server, gzip+zstd, security headers, access log }`.
   - `www.wanmeivn.com { redir → apex, permanent }`.
3. `caddy validate` → OK.
4. `caddy reload` — Caddy tự động bắt đầu flow ACME.
5. Theo dõi log Caddy thấy:
   - Đăng ký account ACME với Let's Encrypt.
   - Phục vụ challenge TLS-ALPN-01 cho cả 2 host (Caddy tự chọn cái này; HTTP-01 đã dự kiến nhưng ALPN cũng OK trên :443).
   - Cả 2 cert được cấp trong ~7 giây.
6. Test HTTPS bằng curl: apex 200, www 301, HTTP 308 → HTTPS — đúng kỳ vọng.

**Kỹ sư đã nói:**
> "🎉 HTTPS đã LIVE. Cert cấp trong ~7 giây qua TLS-ALPN-01 challenge. Caddy tự chọn — hoạt động vì :443 đã mở."

### Pha 5 — Verify

**Công cụ:** `nslookup` (đồng nhất giữa các resolver), `curl -I` (hành vi HTTP), `openssl s_client` (subject/issuer/dates của cert).

**Đã verify:**
| Mục | Kết quả |
|---|---|
| DNS apex → .40 (3 resolver) | ✅ |
| DNS www → .40 | ✅ |
| **DNS tieu3q vẫn → .13** | ✅ |
| `https://wanmeivn.com` → 200 với HSTS header | ✅ |
| `https://www.wanmeivn.com` → 301 → apex | ✅ |
| `http://wanmeivn.com` → 308 → HTTPS | ✅ |
| Cert subject = `CN=wanmeivn.com`, issuer = Let's Encrypt E8 | ✅ |
| Cert hợp lệ 2026-05-09 → 2026-08-07 (90 ngày) | ✅ |
| Spot check asset HTTPS (yy2103.css 200, nav-logo.png 200) | ✅ |
| **`https://tieu3q.wanmeivn.com` vẫn 200 (game không bị ảnh hưởng)** | ✅ |

### Pha 6 — Hardening

**Công cụ:** PowerShell họ `New-ScheduledTask` (không dùng nssm vì nssm.cc trả 503 và auto-mode classifier — đúng — chặn việc tải từ GitHub mirror không chính thức).

**Đã làm:**
1. Tạo Windows Scheduled Task `Caddy`:
   - Action: `C:\caddy\caddy.exe run --config C:\caddy\Caddyfile`
   - Trigger: at system startup
   - Principal: SYSTEM (LogonType ServiceAccount, RunLevel Highest)
   - Settings: restart tới 3 lần khi fail, không giới hạn thời gian thực thi
2. Stop process Caddy foreground từ Pha 1.
3. Start scheduled task — xác nhận Caddy chạy với SYSTEM (PID 13352).
4. Verify port 80 + 443 vẫn listening trên process mới do SYSTEM sở hữu.
5. Stop `npx serve` trên port 3000 (không cần nữa).
6. Smoke test HTTPS cuối cùng pass.
7. Viết `Webgame-main/docs/deployment-260509-wanmeivn-apex.md` với chi tiết vận hành đầy đủ.

**Kỹ sư đã nói về service install:**
> "nssm.cc trả 503 khi tôi cố tải. Auto-mode classifier (đúng) chặn tôi tải từ GitHub mirror không chính thức. Pivot sang Windows Task Scheduler — native hoàn toàn, không cần tải bên thứ ba. Hoạt động cho use case của ta nhưng không hiện trong `services.msc`. Để inspect: `Get-ScheduledTask -TaskName Caddy`. Nếu sau này muốn service "thật" khi nssm.cc mở lại, swap mất ~5 phút."

## Công cụ đã dùng (danh sách đầy đủ)

| Công cụ / Phần mềm | Phiên bản / Nguồn | Mục đích |
|---|---|---|
| Caddy | v2.11.2 (GitHub release) | Web server + auto-HTTPS |
| Let's Encrypt | ACME v02 | Cert TLS miễn phí (90 ngày, tự gia hạn) |
| Windows Task Scheduler | Native Windows Server 2019 | Caddy auto-start khi boot, chạy với SYSTEM |
| Windows Firewall | Native Windows Server 2019 | Rule inbound :80 + :443 |
| PowerShell 5.1 | Tích hợp OS | Mọi thao tác sysadmin |
| Bash + curl | Git for Windows / MSYS2 | Verify HTTP, kiểm tra asset |
| OpenSSL | Git for Windows | Inspect cert (`x509 -noout`) |
| nslookup | Tích hợp OS | Verify DNS qua nhiều resolver |
| Panel web dnspro.vn | bên ngoài | Quản lý DNS records (do user thực hiện) |

## Cảnh báo / ghi chú trong quá trình

Đây là các cảnh báo / khuyến nghị quan trọng — sếp nên biết:

1. **Vấn đề bản quyền/thương hiệu (đã flag từ sớm).** Trang mirror là bản clone pixel-faithful của `games.wanmei.com`. Host tại "wanmeivn" đọc thành "Wanmei Vietnam" — gần như chắc chắn vi phạm bản quyền/thương hiệu nếu công khai. Người dùng xác nhận: "thử nghiệm, sẽ đổi tên sau, chỉ tester nội bộ." OK đi tiếp lúc này; **bắt buộc rebrand trước khi launch công khai.**

2. **Windows Server 2019 Datacenter Evaluation.** Bản đang cài hết hạn sau 180 ngày. Nếu apex sống lâu trên máy này, **vấn đề license cần báo lên người chủ hạ tầng.**

3. **Folder `picture/` chứa thông tin đăng nhập.** Screenshot password panel DNS dnspro.vn được lưu ở đó. Đã xác nhận `picture/` phải có trong `.gitignore`; **không được commit vào git.**

4. **Email contact của ACME.** Đã tự điền `tringuyen14071992@gmail.com` (email kỹ sư từ session context). Let's Encrypt sẽ gửi cảnh báo hết hạn cert tới đó. Đổi trong block global của `C:\caddy\Caddyfile` nếu muốn dùng email ops khác.

5. **TTL = 3600 trong lúc deploy.** Plan ban đầu yêu cầu hạ xuống 300 trước khi đổi để rollback nhanh. Đã không làm vì DNS đã được đổi trước khi ta tới đó. Rủi ro: nếu có vấn đề nghiêm trọng, lan truyền rollback lên tới 1 giờ. Hôm nay chấp nhận được vì apex trước đây không sử dụng.

6. **Hoãn submit HSTS preload.** Submit apex vào danh sách HSTS preload của Chrome là không thể đảo ngược trong ~6 tháng. Không phù hợp với site đang test/chờ rebrand. Hoãn vô thời hạn.

7. **Service-qua-Task-Scheduler vs Windows Service thật.** Tương đương về chức năng restart-sau-reboot, nhưng task Caddy không hiện trong `services.msc`. Nếu muốn Windows Service "đúng nghĩa", cài `nssm` (khi nssm.cc vào được) và swap trong ~5 phút.

8. **Test reboot còn chờ.** Auto-start đã cấu hình nhưng chưa test thực tế. **Bạn (người dùng) phải chạy `Restart-Computer` và verify Caddy tự khởi động trong ~3 phút sau boot.** Tôi không làm được — reboot sẽ ngắt session của tôi.

## Bạn (user) đã làm gì vs tôi đã làm gì

### Bạn đã làm
- Cung cấp credential panel DNS dnspro.vn (qua screenshot trước đó).
- Update DNS tại registrar (apex → .40, thêm www → .40) — quan sát thấy đã làm khi tới phase đó.
- Test khả năng truy cập từ ngoài của `http://160.191.3.40/` từ thiết bị khác.
- Phê duyệt cuối cho plan, recommendations, deployment.

### Tôi đã làm (tự động trên VPS .40)
- Tải, cài Caddy, viết Caddyfile (Pha 1 + Pha 4).
- Rule Windows Firewall (Pha 1).
- Trigger cấp cert ACME qua Caddy reload (Pha 4).
- Mọi verification curl/nslookup/openssl (Pha 5).
- Đăng ký Windows Task Scheduler service (Pha 6).
- Stop legacy npx serve trên :3000 (Pha 6).
- Viết deployment record và brainstorm/plan documents.

### Bạn vẫn cần làm
- **Test reboot** (`Restart-Computer -Force`, sau đó verify HTTPS trong 3 phút).
- Triage vấn đề license Windows Server (hạn của bản Eval).
- (Tùy chọn) Swap Task Scheduler → nssm Service khi nssm.cc vào được.
- (Tương lai) Rebrand nội dung mirror trước khi launch công khai.

## Mục còn mở / pending

| # | Mục | Blocker / Người chịu trách nhiệm |
|---|---|---|
| 1 | Test reboot | User (sẽ ngắt kết nối tôi) |
| 2 | Vấn đề license Windows Server | Người chủ hạ tầng |
| 3 | Quy ước đặt tên subdomain cho game tương lai | Sếp ("tính sau") |
| 4 | Swap Task Scheduler → Windows Service thật qua nssm | Tùy chọn, chờ nssm.cc vào được |
| 5 | Rebrand nội dung mirror trước khi launch | Product / sếp |

## Tham chiếu nhanh

| Cái gì | Ở đâu |
|---|---|
| Binary web server | `C:\caddy\caddy.exe` |
| Caddyfile production | `C:\caddy\Caddyfile` |
| Backup pre-prod | `C:\caddy\Caddyfile.phase1.bak` |
| Access log | `C:\caddy\logs\wanmeivn-access.log` |
| Lưu trữ cert | `C:\Users\Administrator\AppData\Roaming\Caddy\` |
| Nội dung mirror | `C:\web\web1\webgame\Webgame-main\mirror\` |
| Plan | `Webgame-main/plans/260509-1452-wanmeivn-apex-deploy/plan.md` |
| Brainstorm (EN) | `Webgame-main/plans/reports/brainstorm-2026-05-09-wanmeivn-apex-deploy.md` |
| Brainstorm (VN) | `Webgame-main/plans/reports/brainstorm-2026-05-09-wanmeivn-apex-deploy-vi.md` |
| Deployment record | `Webgame-main/docs/deployment-260509-wanmeivn-apex.md` |
| Handoff team game | `Webgame-main/docs/handoff-260509-0308-wanmeivn-apex-to-vps40.md` |

## Runbook vận hành (cheat sheet)

```powershell
# Trạng thái
Get-ScheduledTask -TaskName Caddy
Get-Process caddy
Get-NetTCPConnection -LocalPort 80,443 -State Listen

# Restart
Stop-ScheduledTask -TaskName Caddy
Get-Process caddy | Stop-Process -Force
Start-ScheduledTask -TaskName Caddy

# Reload sau khi sửa Caddyfile (không cần restart)
& "C:\caddy\caddy.exe" reload --config C:\caddy\Caddyfile

# Logs
Get-Content C:\caddy\logs\wanmeivn-access.log -Tail 50

# Roll back triển khai
# 1. dnspro.vn → @ A về 160.191.3.13, xóa bản ghi A www
# 2. Stop-ScheduledTask -TaskName Caddy
# 3. Get-Process caddy | Stop-Process -Force
```
