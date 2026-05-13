---
type: session-handoff
date: 2026-05-10
status: WIP — staging only, NOT yet deployed to live
audience: future Claude / new dev / new device
domain: wanmeivn.com
---

# Session Handoff — wanmeivn.com responsive retrofit (2026-05-10)

> **READ THIS FIRST** before making any changes to wanmeivn.com.
> This document describes work-in-progress on a staging server.
> **DO NOT push the responsive changes to the live `https://wanmeivn.com/` without explicit user permission.**

---

## 🛑 Critical rules

1. **Live `https://wanmeivn.com/` MUST NOT be modified** until the user explicitly says "deploy to live" or "sync to mirror". No exceptions.
2. **All experimental work happens in `mirror-staging/` on VPS .40**, served at `http://160.191.3.40:8080/`. The user tests there.
3. **Never replace HTML structure / images / sections / "external interface"** unless the user requests it. Internal CSS/JS code is fine to change. Visual look should match the existing Wanmei homepage.
4. **For CSS issues, use DevTools-driven debugging, not guess-and-check.** See `~/.claude/projects/.../memory/workflow_devtools_debug.md` if loading from memory; otherwise see "DevTools workflow" below.
5. **The original Wanmei page is preserved at `mirror-staging/index-original.html`** as an A/B reference.

---

## 📍 Where we are right now

### What's LIVE on `https://wanmeivn.com/` (don't touch)

The original full Wanmei homepage clone (Chinese game portal, fixed 1920px desktop layout) is what the public sees. Cosmetic fixes already applied to live:
- `<title>` → "Wanmei Vietnam"
- Meta description / keywords / OG tags → English
- `<link rel="canonical">` → set
- `Cache-Control: no-cache, must-revalidate` header
- Favicon link
- `nav-logo-main.png` 404 fix (line 542 JS)
- All committed to GitHub `main` branch

### What's on STAGING (`http://160.191.3.40:8080/`)

The live page PLUS work-in-progress responsive retrofit:
- `mirror-staging/responsive-overlay.css` — fluid layout overrides
- `mirror-staging/index.html` — same as live but with viewport meta + cache-buster + inline responsive `<style>` block + JS Swiper-killer at end of body
- `mirror-staging/index-original.html` — pristine backup of original Wanmei

### What's WORKING in staging (verified via DevTools)

| Section | Status | Evidence |
|---|---|---|
| Brand-business tiles (品牌业务) | ✅ Fluid responsive | `getComputedStyle(li).width = 225px` (was 240px hardcoded). `aspectRatio = 240/374`, `display = grid`. Reflows continuously across viewports. |
| Hero swiper thumbnails (.productCarousel-thumbs) | ✅ Visible on phone | Was `position: absolute; top: 800px` → off-screen on phone. Now `position: relative; top: 0` at `≤1023px`. Computed `rect.y = 318` confirms on-screen. |
| `<title>` | ✅ "Wanmei Vietnam" |
| Viewport meta | ✅ Present in HTML head |
| CSS file (responsive-overlay.css) | ✅ Loads with `?v=...` cache-buster |

### What's NOT YET working in staging

These sections still have upstream's fixed-width layouts and need surgical CSS overrides similar to brand-tiles:

- `.hot_games_list` (热门游戏 — hot games grid) — likely `width: 1218px` somewhere
- `.newgame_list` (新游推荐 — new games)
- `.offical_list` (官方/客户端游戏 list)
- `.cv_swiper` (news ticker carousel)
- `.top_box` / `.top_nav_ul` (top nav row, may overflow on narrow widths)
- Inner content of hero swiper at narrow widths (text overlays, side floats)

### What's NOT applicable for now (per user)

- **Mobile burger nav** — not requested
- **Touch-optimized swiper gestures** — works as-is via Swiper's defaults
- **Game tile artwork swap** — deferred to rebrand
- **Real game banner images** — using existing Wanmei assets; rebrand will replace

---

## 🗺️ File map

```
Webgame-main/
├── mirror/                          ← LIVE — served at https://wanmeivn.com/
│   ├── index.html                   ← Cosmetic fixes (title, meta, favicon) only
│   └── ... (CSS, images, JS unchanged from upstream)
│
├── mirror-staging/                  ← STAGING — served at http://160.191.3.40:8080/
│   ├── index.html                   ← LIVE + responsive overlay link + inline <style> + JS Swiper-killer
│   ├── index-original.html          ← Backup of original Wanmei (A/B reference at /index-original.html)
│   ├── responsive-overlay.css       ← Fluid responsive overrides (~13 KB)
│   └── ... (other files identical to mirror/)
│
├── docs/
│   ├── deployment-260509-wanmeivn-apex.md      ← Caddy/DNS/cert deploy record
│   ├── handoff-260509-0308-wanmeivn-apex-to-vps40.md  ← incoming game-team handoff
│   └── session-handoff-2026-05-10-responsive-staging.md  ← THIS FILE
│
└── plans/reports/                   ← Brainstorm + walkthrough docs
    ├── brainstorm-2026-05-09-wanmeivn-apex-deploy.md
    ├── report-260509-1504-wanmeivn-deployment-walkthrough.md
    └── ... (EN + VN versions)
```

---

## 🛠️ How staging works

### Architecture

```
User's browser
    │
    ▼
http://160.191.3.40:8080/  (npx serve, runs as background process on .40)
    │
    └─► serves files from C:\web\web1\webgame\Webgame-main\mirror-staging\

Live (untouched while we iterate):
http://160.191.3.40:80, https://160.191.3.40:443  (Caddy, runs as Windows Scheduled Task)
    │
    └─► serves files from C:\web\web1\webgame\Webgame-main\mirror\
```

### Restoring the staging server after VPS reboot

```powershell
cd "C:\web\web1\webgame\Webgame-main"
Start-Process -FilePath "C:\Program Files\nodejs\npx.cmd" `
    -ArgumentList "serve","mirror-staging","-p","8080","--no-clipboard","--no-port-switching" `
    -WorkingDirectory "C:\web\web1\webgame\Webgame-main" `
    -WindowStyle Hidden `
    -RedirectStandardOutput "C:\caddy\logs\staging-stdout.log" `
    -RedirectStandardError "C:\caddy\logs\staging-stderr.log"
```

Firewall rule `Staging-HTTP-8080` allows inbound :8080 (already created).

---

## ➡️ Next actions

### Option A — adjust hero thumbnails size (optional polish)

Currently each thumb is `clamp(56px, 16vw, 100px)` → small. If user wants bigger:
- Edit `mirror-staging/index.html` inline `<style>` block
- Find `.productCarousel-thumbs .swiper-slide`'s `width: clamp(56px, 16vw, 100px)`
- Change to e.g. `clamp(80px, 20vw, 140px)` for medium

### Option B — fix next broken section

Iterate one section at a time using **DevTools workflow**:

1. Ask user to open the page in Chrome DevTools, right-click problem element, "Inspect"
2. User reads off the parent class chain
3. Audit upstream CSS for that section's fixed widths:
   ```powershell
   Get-ChildItem "mirror-staging\games.wanmei.com\style" -Filter *.css | ForEach-Object {
     $content = Get-Content $_.FullName -Raw
     [regex]::Matches($content, '\.SECTION_CLASS[^{]*\{[^}]+\}') | ForEach-Object { $_.Value }
   }
   ```
4. Write surgical CSS override in `mirror-staging/index.html` inline `<style>` (highest priority) OR `responsive-overlay.css`
5. Bump cache-buster query string in HTML (`?v=20260510-XXXX`)
6. User reloads + tests + reports DevTools `getComputedStyle(...)` values
7. Iterate until DevTools confirms the fix applied

### Option C — sync staging to live (REQUIRES USER PERMISSION)

When user says "deploy to live" / "sync to mirror" / equivalent:

```powershell
# 1. Copy responsive files to live mirror
Copy-Item "C:\web\web1\webgame\Webgame-main\mirror-staging\index.html" `
          "C:\web\web1\webgame\Webgame-main\mirror\index.html" -Force
Copy-Item "C:\web\web1\webgame\Webgame-main\mirror-staging\responsive-overlay.css" `
          "C:\web\web1\webgame\Webgame-main\mirror\responsive-overlay.css" -Force

# 2. Mirror same edits in the github clone
Copy-Item "C:\web\web1\webgame\Webgame-main\mirror-staging\index.html" `
          "C:\Users\Administrator\webgame-clone\mirror\index.html" -Force
Copy-Item "C:\web\web1\webgame\Webgame-main\mirror-staging\responsive-overlay.css" `
          "C:\Users\Administrator\webgame-clone\mirror\responsive-overlay.css" -Force

# 3. Push to GitHub via Git Data API (regular git push hangs on this VPS due to TLS)
# See pattern in earlier sessions — use $gh api -X POST repos/.../git/blobs etc.
```

After sync, verify via `curl https://wanmeivn.com/` that the new CSS loads.

---

## 🐛 DevTools workflow (CRITICAL — read before any CSS work)

When CSS overrides aren't taking effect:

1. Open `http://160.191.3.40:8080/` in **Chrome on desktop** (or use Chrome's mobile emulator)
2. Press **F12** → Console tab
3. Verify the element you're targeting actually exists:
   ```js
   const el = document.querySelector('YOUR_SELECTOR');
   console.log('exists:', !!el, 'parent:', el?.parentElement?.className);
   ```
4. Check computed styles to see WHAT WINS:
   ```js
   if (el) {
     const cs = getComputedStyle(el);
     console.log({display: cs.display, width: cs.width, height: cs.height,
                  position: cs.position, flex: cs.flex});
   }
   ```
5. Check inline styles JS may have set:
   ```js
   console.log('inline:', el?.getAttribute('style'));
   ```
6. In **Elements > Styles** panel, click the element → see WHICH CSS rule provides the winning property (the one not struck through)

**NEVER write CSS overrides without first verifying the element exists and checking what's currently winning.** Hours were wasted on 2026-05-09 writing CSS for `.gallery-top` when the actual section used `.brand_list ul li.brand1`.

---

## 🔑 Key references / lessons learned

### The brand-tiles lesson

The 5 brand-business tiles (品牌业务) are NOT in `.gallery-top` or any Swiper. They're plain floated `<li>` with classes `brand1` / `brand2` / `brand3` / `brand4` / `brand5`, parent is `.brand_list ul`. Upstream rules:

```css
.brand_list ul     { width: 958px; margin: 0 auto; }
.brand_list ul li  { width: 240px; height: 374px; float: left; }
.brand_list ul .brand1 { background: url(brand-tile-01.png); }
.brand_list ul .brand1:after { background: url(brand-tile-01-hover.png); opacity: 0; }
.brand_list ul .brand1:hover:after { opacity: 1; }
```

The working override (in `mirror-staging/index.html` inline `<style>`):

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

### The hero-thumbs lesson

The hero swiper thumbnails use `position: absolute; top: 800px; left: 445px` — designed for 1920×905 desktop. On phone they go offscreen below the visible page. Fix: under `@media (max-width: 1023px)`, override to `position: relative; top: 0`.

### Why git push hangs from this VPS

Standard `git push` over HTTPS to github.com hangs from VPS .40 (Windows TLS schannel issue with github.com over HTTP/2). **Workaround: use the GitHub Git Data API via `gh api`** to upload blob → tree → commit → ref. See past commits for pattern (commits `fd98c45c`, `d1b4ae34`, `694782c1`, `df5e6102`, `cd8cdb38` were all done this way).

---

## 📋 What the user wants (summary)

1. **Make wanmeivn.com responsive** so layout reflows continuously as window resizes (Facebook-style fluid).
2. **Don't change the visible interface** — same images, same sections, same Wanmei look.
3. **Internal code (CSS, JS, structure of HTML where needed) can change** to enable responsive behavior.
4. **Test everything in staging first.** Live wanmeivn.com only updates when user explicitly approves.
5. **Major rebrand is coming later** — content/images/games will be replaced. Current state is temp.

---

## 🚦 Quick status snapshot

| Item | State |
|---|---|
| Live wanmeivn.com responsive | ❌ Not yet |
| Staging responsive (brand tiles) | ✅ Working |
| Staging responsive (hero thumbs on mobile) | ✅ Working |
| Staging responsive (other sections) | ⏳ TODO |
| User permission to deploy responsive to live | ❌ Not yet given |
| GitHub repo synced with live | ✅ Yes (latest commit `cd8cdb38`) |
| GitHub repo synced with staging WIP | ❌ No (staging is WIP, only ship when ready) |

---

## 🆕 If you're a new Claude session reading this

1. Read this whole doc.
2. Read `~/.claude/projects/C--web-web1-webgame/memory/MEMORY.md` for context across sessions.
3. The user prefers concise responses, brutal honesty, DevTools-driven debugging.
4. The user's GitHub identity is `BlackCat-Ent-Studio` (commits use noreply email `201958222+BlackCat-Ent-Studio@users.noreply.github.com`).
5. The PAT used to push to GitHub during 2026-05-09 was `ghp_xs...37gjtr` — **assume revoked**; ask user for a fresh one if you need to push.
6. **Confirm staging URL is reachable** (`http://160.191.3.40:8080/`) before promising any responsive testing — the npx serve background process may have died on reboot.
7. **Honor the deploy gate.** Don't push staging changes to mirror/ or to GitHub main without explicit "deploy / sync / publish" instruction.

---

## Open questions / decisions needed from user

- [ ] Bigger hero thumbnails on mobile? (current 56–100px each clamp)
- [ ] Which next section to fix? (hot games, new games, news ticker, top nav)
- [ ] When to deploy staging → live?
- [ ] Boss approval for the responsive retrofit before public users see it?
