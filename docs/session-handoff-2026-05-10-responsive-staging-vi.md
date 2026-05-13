---
type: session-handoff
date: 2026-05-10
status: WIP — chỉ trên staging, CHƯA deploy lên live
audience: Claude session sau / dev mới / thiết bị mới
domain: wanmeivn.com
---

# Bàn giao phiên làm việc — wanmeivn.com responsive retrofit (2026-05-10)

> **ĐỌC FILE NÀY TRƯỚC** khi thực hiện bất kỳ thay đổi nào với wanmeivn.com.
> Tài liệu này mô tả công việc đang dang dở trên staging server.
> **KHÔNG được push các thay đổi responsive lên live `https://wanmeivn.com/` nếu chưa có sự cho phép rõ ràng từ user.**

> 🇬🇧 English version: `session-handoff-2026-05-10-responsive-staging.md`

---

## 🛑 Quy tắc bắt buộc

1. **Live `https://wanmeivn.com/` KHÔNG được sửa** cho đến khi user nói rõ "deploy to live" / "sync to mirror" / tương đương. Không có ngoại lệ.
2. **Mọi công việc thử nghiệm chạy trong `mirror-staging/` trên VPS .40**, phục vụ tại `http://160.191.3.40:8080/`. User test ở đó.
3. **Không thay HTML structure / images / sections / "external interface"** trừ khi user yêu cầu. CSS/JS bên trong thay đổi được. Hình ảnh phải giống Wanmei homepage hiện tại.
4. **Khi gặp vấn đề CSS, dùng debug bằng DevTools, không đoán mò.** Xem `~/.claude/projects/.../memory/workflow_devtools_debug.md` nếu load từ memory; nếu không xem mục "Quy trình DevTools" bên dưới.
5. **Trang Wanmei gốc được giữ tại `mirror-staging/index-original.html`** làm tham chiếu A/B.

---

## 📍 Tình trạng hiện tại

### Trên LIVE `https://wanmeivn.com/` (đừng đụng vào)

Bản clone Wanmei homepage gốc (Chinese game portal, layout cố định 1920px desktop) là cái mà công chúng thấy. Các fix cosmetic đã apply lên live:
- `<title>` → "Wanmei Vietnam"
- Meta description / keywords / OG tags → tiếng Anh
- `<link rel="canonical">` → set
- Header `Cache-Control: no-cache, must-revalidate`
- Link favicon
- Fix lỗi 404 `nav-logo-main.png` (line 542 JS)
- Tất cả đã commit lên branch `main` của GitHub

### Trên STAGING (`http://160.191.3.40:8080/`)

Trang live + công việc dở dang về responsive retrofit:
- `mirror-staging/responsive-overlay.css` — các CSS override fluid layout
- `mirror-staging/index.html` — giống live + viewport meta + cache-buster + inline `<style>` block + JS Swiper-killer cuối body
- `mirror-staging/index-original.html` — backup nguyên gốc của Wanmei

### Đang HOẠT ĐỘNG trên staging (đã verify qua DevTools)

| Section | Trạng thái | Bằng chứng |
|---|---|---|
| Brand-business tiles (品牌业务) | ✅ Fluid responsive | `getComputedStyle(li).width = 225px` (trước là 240px hardcoded). `aspectRatio = 240/374`, `display = grid`. Reflow liên tục theo viewport. |
| Hero swiper thumbnails (.productCarousel-thumbs) | ✅ Hiện trên phone | Trước là `position: absolute; top: 800px` → off-screen trên phone. Giờ `position: relative; top: 0` ở `≤1023px`. Computed `rect.y = 318` xác nhận on-screen. |
| `<title>` | ✅ "Wanmei Vietnam" |
| Viewport meta | ✅ Có trong HTML head |
| File CSS (responsive-overlay.css) | ✅ Load với cache-buster `?v=...` |

### CHƯA hoạt động trên staging

Các section sau vẫn còn layout fixed-width của upstream và cần CSS override surgical tương tự brand-tiles:

- `.hot_games_list` (热门游戏 — hot games grid) — có thể có `width: 1218px` đâu đó
- `.newgame_list` (新游推荐 — new games)
- `.offical_list` (官方/客户端游戏 list)
- `.cv_swiper` (news ticker carousel)
- `.top_box` / `.top_nav_ul` (top nav row, có thể overflow ở viewport hẹp)
- Inner content của hero swiper ở viewport hẹp (text overlays, side floats)

### Tạm thời không cần làm (theo user)

- **Mobile burger nav** — không yêu cầu
- **Touch-optimized swiper gestures** — chạy được với default của Swiper
- **Swap artwork game tile** — hoãn đến khi rebrand
- **Banner game thật** — đang dùng asset Wanmei hiện có; rebrand sẽ thay

---

## 🗺️ Bản đồ file

```
Webgame-main/
├── mirror/                          ← LIVE — phục vụ tại https://wanmeivn.com/
│   ├── index.html                   ← Chỉ có cosmetic fixes (title, meta, favicon)
│   └── ... (CSS, images, JS giữ nguyên upstream)
│
├── mirror-staging/                  ← STAGING — phục vụ tại http://160.191.3.40:8080/
│   ├── index.html                   ← LIVE + link responsive overlay + inline <style> + JS Swiper-killer
│   ├── index-original.html          ← Backup Wanmei gốc (tham chiếu A/B tại /index-original.html)
│   ├── responsive-overlay.css       ← CSS override fluid responsive (~13 KB)
│   └── ... (file khác giống mirror/)
│
├── docs/
│   ├── deployment-260509-wanmeivn-apex.md      ← Caddy/DNS/cert deploy record
│   ├── handoff-260509-0308-wanmeivn-apex-to-vps40.md  ← handoff vào từ team game
│   └── session-handoff-2026-05-10-responsive-staging.md  ← bản EN
│   └── session-handoff-2026-05-10-responsive-staging-vi.md ← FILE NÀY
│
└── plans/reports/                   ← Brainstorm + walkthrough docs
    ├── brainstorm-2026-05-09-wanmeivn-apex-deploy.md
    ├── report-260509-1504-wanmeivn-deployment-walkthrough.md
    └── ... (bản EN + VN)
```

---

## 🛠️ Cách staging hoạt động

### Kiến trúc

```
Trình duyệt user
    │
    ▼
http://160.191.3.40:8080/  (npx serve, chạy như background process trên .40)
    │
    └─► phục vụ file từ C:\web\web1\webgame\Webgame-main\mirror-staging\

Live (không động vào lúc đang iterate):
http://160.191.3.40:80, https://160.191.3.40:443  (Caddy, chạy như Windows Scheduled Task)
    │
    └─► phục vụ file từ C:\web\web1\webgame\Webgame-main\mirror\
```

### Khôi phục staging server sau khi reboot VPS

```powershell
cd "C:\web\web1\webgame\Webgame-main"
Start-Process -FilePath "C:\Program Files\nodejs\npx.cmd" `
    -ArgumentList "serve","mirror-staging","-p","8080","--no-clipboard","--no-port-switching" `
    -WorkingDirectory "C:\web\web1\webgame\Webgame-main" `
    -WindowStyle Hidden `
    -RedirectStandardOutput "C:\caddy\logs\staging-stdout.log" `
    -RedirectStandardError "C:\caddy\logs\staging-stderr.log"
```

Firewall rule `Staging-HTTP-8080` cho phép inbound :8080 (đã tạo).

---

## ➡️ Hành động tiếp theo

### Phương án A — chỉnh kích thước hero thumbnails (polish tùy chọn)

Mỗi thumb hiện tại là `clamp(56px, 16vw, 100px)` → nhỏ. Nếu user muốn lớn hơn:
- Sửa block inline `<style>` trong `mirror-staging/index.html`
- Tìm `.productCarousel-thumbs .swiper-slide`'s `width: clamp(56px, 16vw, 100px)`
- Đổi ví dụ thành `clamp(80px, 20vw, 140px)` cho size trung bình

### Phương án B — fix section tiếp theo

Iterate từng section dùng **quy trình DevTools**:

1. Yêu cầu user mở trang trong Chrome DevTools, chuột phải vào element có vấn đề, "Inspect"
2. User đọc parent class chain
3. Audit CSS upstream cho fixed widths của section đó:
   ```powershell
   Get-ChildItem "mirror-staging\games.wanmei.com\style" -Filter *.css | ForEach-Object {
     $content = Get-Content $_.FullName -Raw
     [regex]::Matches($content, '\.SECTION_CLASS[^{]*\{[^}]+\}') | ForEach-Object { $_.Value }
   }
   ```
4. Viết CSS override chính xác trong inline `<style>` của `mirror-staging/index.html` (priority cao nhất) HOẶC `responsive-overlay.css`
5. Tăng cache-buster query string trong HTML (`?v=20260510-XXXX`)
6. User reload + test + báo cáo giá trị `getComputedStyle(...)` từ DevTools
7. Iterate cho đến khi DevTools xác nhận fix đã apply

### Phương án C — sync staging lên live (CẦN USER CHO PHÉP)

Khi user nói "deploy to live" / "sync to mirror" / tương đương:

```powershell
# 1. Copy file responsive sang live mirror
Copy-Item "C:\web\web1\webgame\Webgame-main\mirror-staging\index.html" `
          "C:\web\web1\webgame\Webgame-main\mirror\index.html" -Force
Copy-Item "C:\web\web1\webgame\Webgame-main\mirror-staging\responsive-overlay.css" `
          "C:\web\web1\webgame\Webgame-main\mirror\responsive-overlay.css" -Force

# 2. Mirror thay đổi tương tự trong github clone
Copy-Item "C:\web\web1\webgame\Webgame-main\mirror-staging\index.html" `
          "C:\Users\Administrator\webgame-clone\mirror\index.html" -Force
Copy-Item "C:\web\web1\webgame\Webgame-main\mirror-staging\responsive-overlay.css" `
          "C:\Users\Administrator\webgame-clone\mirror\responsive-overlay.css" -Force

# 3. Push lên GitHub qua Git Data API (regular git push hang trên VPS này do TLS)
# Xem pattern trong các session trước — dùng $gh api -X POST repos/.../git/blobs ...
```

Sau khi sync, verify qua `curl https://wanmeivn.com/` xem CSS mới đã load chưa.

---

## 🐛 Quy trình DevTools (QUAN TRỌNG — đọc trước khi làm CSS)

Khi CSS override không có hiệu lực:

1. Mở `http://160.191.3.40:8080/` trong **Chrome desktop** (hoặc dùng Chrome's mobile emulator)
2. Bấm **F12** → Console tab
3. Verify element bạn target tồn tại thật:
   ```js
   const el = document.querySelector('YOUR_SELECTOR');
   console.log('exists:', !!el, 'parent:', el?.parentElement?.className);
   ```
4. Kiểm tra computed styles xem CÁI NÀO ĐANG WIN:
   ```js
   if (el) {
     const cs = getComputedStyle(el);
     console.log({display: cs.display, width: cs.width, height: cs.height,
                  position: cs.position, flex: cs.flex});
   }
   ```
5. Kiểm tra inline style mà JS có thể set:
   ```js
   console.log('inline:', el?.getAttribute('style'));
   ```
6. Trong panel **Elements > Styles**, click element → xem RULE NÀO cung cấp property thắng (cái không bị gạch ngang)

**TUYỆT ĐỐI KHÔNG viết CSS override mà chưa verify element tồn tại và check rule nào đang win.** Đã mất nhiều giờ ngày 2026-05-09 viết CSS cho `.gallery-top` trong khi section thật dùng `.brand_list ul li.brand1`.

---

## 🔑 Tham chiếu / bài học rút ra

### Bài học brand-tiles

5 brand-business tiles (品牌业务) KHÔNG nằm trong `.gallery-top` hay Swiper nào. Chúng chỉ là `<li>` plain với class `brand1` / `brand2` / `brand3` / `brand4` / `brand5`, parent là `.brand_list ul`. Rule upstream:

```css
.brand_list ul     { width: 958px; margin: 0 auto; }
.brand_list ul li  { width: 240px; height: 374px; float: left; }
.brand_list ul .brand1 { background: url(brand-tile-01.png); }
.brand_list ul .brand1:after { background: url(brand-tile-01-hover.png); opacity: 0; }
.brand_list ul .brand1:hover:after { opacity: 1; }
```

Override hoạt động (trong inline `<style>` của `mirror-staging/index.html`):

```css
.bg .brand_box .brand_list ul {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)) !important;
  width: 100% !important;
  max-width: 1100px !important;
}
.bg .brand_box .brand_list ul li {
  width: 100% !important;
  height: auto !important;
  float: none !important;
  aspect-ratio: 240 / 374 !important;
  background-size: 100% 100% !important;
}
```

### Bài học hero-thumbs

Thumbnails của hero swiper dùng `position: absolute; top: 800px; left: 445px` — thiết kế cho desktop 1920×905. Trên phone chúng đi off-screen dưới khu vực hiển thị. Fix: dưới `@media (max-width: 1023px)`, override thành `position: relative; top: 0`.

### Tại sao git push hang từ VPS này

`git push` qua HTTPS lên github.com hang từ VPS .40 (vấn đề TLS schannel của Windows với github.com qua HTTP/2). **Workaround: dùng GitHub Git Data API qua `gh api`** để upload blob → tree → commit → ref. Xem các commit cũ làm pattern (`fd98c45c`, `d1b4ae34`, `694782c1`, `df5e6102`, `cd8cdb38`, `a8dd25e4` đều làm theo cách này).

---

## 📋 User muốn gì (tóm tắt)

1. **Làm wanmeivn.com responsive** để layout reflow liên tục khi resize cửa sổ (Facebook-style fluid).
2. **Không thay đổi visible interface** — cùng images, cùng sections, cùng look Wanmei.
3. **Code bên trong (CSS, JS, structure HTML khi cần) thay đổi được** để enable responsive behavior.
4. **Test mọi thứ trên staging trước.** Live wanmeivn.com chỉ update khi user cho phép rõ ràng.
5. **Major rebrand sẽ đến sau** — content/images/games sẽ thay. Trạng thái hiện tại là tạm.

---

## 🚦 Trạng thái nhanh

| Mục | Trạng thái |
|---|---|
| Live wanmeivn.com responsive | ❌ Chưa |
| Staging responsive (brand tiles) | ✅ Hoạt động |
| Staging responsive (hero thumbs trên mobile) | ✅ Hoạt động |
| Staging responsive (các section khác) | ⏳ TODO |
| User cho phép deploy responsive lên live | ❌ Chưa cho phép |
| Repo GitHub đã sync với live | ✅ Có (commit mới nhất `cd8cdb38`, handoff doc `a8dd25e4`) |
| Repo GitHub đã sync với staging WIP | ❌ Không (staging là WIP, chỉ ship khi sẵn sàng) |

---

## 🆕 Nếu bạn là Claude session mới đọc tài liệu này

1. Đọc toàn bộ tài liệu này.
2. Đọc `~/.claude/projects/C--web-web1-webgame/memory/MEMORY.md` để có context xuyên session.
3. User thích phản hồi ngắn gọn, brutal honesty, debug bằng DevTools.
4. GitHub identity của user là `BlackCat-Ent-Studio` (commit dùng noreply email `201958222+BlackCat-Ent-Studio@users.noreply.github.com`).
5. PAT đã dùng để push GitHub ngày 2026-05-09 là `ghp_xs...37gjtr` — **giả định đã revoke**; hỏi user PAT mới nếu cần push.
6. **Xác nhận URL staging có truy cập được** (`http://160.191.3.40:8080/`) trước khi hứa hẹn bất kỳ test responsive nào — process npx serve chạy nền có thể đã chết khi reboot.
7. **Tôn trọng deploy gate.** Không push thay đổi staging vào mirror/ hoặc lên GitHub main mà không có lệnh "deploy / sync / publish" rõ ràng từ user.

---

## Câu hỏi mở / quyết định cần từ user

- [ ] Hero thumbnails to hơn trên mobile? (hiện tại clamp 56–100px mỗi cái)
- [ ] Section tiếp theo cần fix? (hot games, new games, news ticker, top nav)
- [ ] Khi nào deploy staging → live?
- [ ] Sếp duyệt responsive retrofit chưa, trước khi public users thấy?
