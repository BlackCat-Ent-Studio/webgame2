---
type: session-handoff
date: 2026-05-12
last-updated: 2026-05-13
from: brainstorm + cook session that wrapped Phases 1-3 of the Wanmei Next.js rebuild
to: future Claude / next dev session
status: IN PROGRESS — Phases 1-5 done (npm install done, dev server live, hero+news shipped). Phase 7 pending + 3 visual fixes outstanding. See "Status as of 2026-05-13" below.
---

# Session Handoff — Wanmei Next.js Rebuild (Phases 1-5 Done, Phase 7 + Visual Fixes Next)

> **READ THIS FIRST** if you just opened this project. Stops at the end with concrete next-action commands.

---

## ✅ Status as of 2026-05-13

Updated to reflect Session 2 work + revert. Older sections below ("TL;DR", "First action", "What you should see", "What the user wants next") describe the **pre-Session-2 state** and are kept for history — read them as historical context only.

**Current code state:**
- `npm install` DONE (75 packages, 0 errors). `node_modules/` populated.
- Dev server runs on `:3000` (Next.js 16.2.6 Turbopack). Returns 200 / ~48 KB HTML.
- **Phase 4 DONE** — `heroSlides.json` has **2** real entries (异环, 幻塔). Image URLs hot-link upstream CDN `gamesvmg.wmupd.com` (1920×1035 landscape + 750×1270 portrait). No `_todo` placeholders.
- **Phase 5 DONE** — `<NewsSection>` component shipped: desktop 2-col (featured banner left + vertical autoplay Swiper ticker right) / mobile (featured banner + stacked cards). Reads `data/news.json`.
- **Data extracted** — `games.json` (gameCenterData) + `news.json` (AD1/AD2/AD5) live alongside `heroSlides.json` (AD3/AD4).
- **Phase 7 NOT done** — `<HotGames>` was built then reverted in the same session per user request. Placeholder 6-tile grid still in `app/page.tsx`. Data is ready in `games.json`; component just needs rebuilding (see Fix #4 below — but note its factual errors corrected inline).

**Outstanding visual fixes from screenshots (added 2026-05-13):** see "Immediate fixes" section directly below.

**Pre-existing issues acknowledged but not fixed:**
- Swiper "not enough slides for loop" console warnings on hero (2 slides, loop=true) and news ticker (4 slides, slidesPerView=4, loop=true). Cosmetic; can be gated on slide-count.
- Nav anchor `#games` points nowhere — section id will be `#hot-games` once Phase 7 ships.

---

## 🛠 Immediate fixes needed at session start (added 2026-05-13)

User ran `npm install` and started `npm run dev`. Two visual bugs found:

**Screenshots for reference:**
- `picture/Screenshot 2026-05-12 235953.png` — initial broken state on desktop (brand tiles + hot games)
- `picture/Screenshot 2026-05-13 002439.png` — hero thumb strip too small (user circled the strip area)
- `picture/Screenshot 2026-05-13 002452.png` — hot games has no real images (user circled the whole section)
- `picture/z7813794673554_*.jpg` — the wanmei.com/m/ reference (target visual feel)

### Fix #1 — Brand-business tiles render too small / wrong aspect ratio

**Symptom:** At desktop width, the 4 brand tiles show as small landscape squares instead of tall portrait tiles (should be ~240×374 aspect like upstream).

**Root cause:** In `wanmei-next-app/components/brand-business.tsx`, the `<img>` uses `absolute inset-0` but the parent `<a>` is missing `relative`. So the image escapes the `<a>` bounds and the aspect-ratio container has no content to size against properly.

**Edit (one line):** In `components/brand-business.tsx`, on the `<a>` element, add `relative` to the className:

```diff
- <a
-   href={b.link}
-   className="block aspect-[4/3] md:aspect-[240/374] rounded-lg overflow-hidden bg-[#1a1d22] ring-1 ring-white/5 group"
- >
+ <a
+   href={b.link}
+   className="relative block aspect-[4/3] md:aspect-[240/374] rounded-lg overflow-hidden bg-[#1a1d22] ring-1 ring-white/5 group"
+ >
```

That's it. Hard-refresh the browser (Ctrl+Shift+R) and the tiles should now be tall portraits filling the columns.

### Fix #2 — Hot games section has missing / asymmetric cells

**Symptom:** Top row shows 4 placeholder cards, bottom row shows only 2 — looks unbalanced and empty.

**Root cause:** `app/page.tsx` uses 6 placeholders in `lg:grid-cols-4` → 4 + 2 layout that looks lopsided. The placeholders are also empty (just "Game N (Phase 7)" text).

**Two valid fixes — pick one:**

**Option A (quick, no data extraction):** balance the grid by using 8 placeholders OR changing column count to 3.

In `app/page.tsx`, change the hot-games section's grid + array:

```diff
- <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
-   {[1, 2, 3, 4, 5, 6].map((i) => (
+ <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
+   {[1, 2, 3, 4, 5, 6].map((i) => (
```

Now 6 items in 3 columns = 2 clean rows of 3.

**Option B (proper, extract real data — Phase 7 work):**

1. Read `mirror/games.wanmei.com/pc_gamecenter2104.js` → locate `gameCenterData`
2. Extract relevant entries (id, name, desc, faceUrl, icon, linkUrl) into `wanmei-next-app/data/games.json`
3. Build `wanmei-next-app/components/hot-games.tsx` consuming that JSON
4. Replace the placeholder section in `app/page.tsx` with `<HotGames />`

Skeleton component to start from:

```tsx
// components/hot-games.tsx
import games from "@/data/games.json";

export function HotGames() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 md:py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">热门游戏</h2>
      <p className="text-sm tracking-[0.3em] text-white/40 mb-6 md:mb-10">TRENDING GAMES</p>
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4 list-none p-0">
        {games.map((g) => (
          <li key={g.id} className="relative bg-[#1a1d22] rounded-lg overflow-hidden">
            <a href={g.linkUrl} className="block">
              <img src={g.faceUrl} alt={g.name} className="w-full aspect-[3/2] object-cover" />
              <div className="flex items-center gap-2 p-3">
                <img src={g.icon} alt="" className="w-8 h-8 rounded" />
                <span className="text-sm text-white font-medium">{g.name}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### Fix #3 — Hero thumbnail strip too small (added 2026-05-13 002439 screenshot)

**Symptom:** Bottom-left of hero shows tiny game icons next to "NTE / NEVERNESS TO EVERNESS" label that are barely visible at desktop width. User circled this in red — wants bigger thumbnails.

**Root cause:** In `wanmei-next-app/components/hero-carousel.tsx`, the thumb-strip Swiper slides use `!w-12 md:!w-16` (48px / 64px) which is fine for phone but tiny on desktop. Also positioned `bottom-3` over the image — should be visually elevated AND larger at desktop.

**Edit:** In `components/hero-carousel.tsx`, find the thumb Swiper and increase slide widths + container padding:

```diff
   <div className="absolute bottom-3 md:bottom-6 left-0 right-0 z-10 pointer-events-none">
-    <div className="max-w-[640px] mx-auto px-4">
+    <div className="max-w-[720px] mx-auto px-4">
       <Swiper
         modules={[Thumbs]}
         onSwiper={setThumbsSwiper}
         slidesPerView={5}
-        spaceBetween={8}
+        spaceBetween={12}
         watchSlidesProgress
         className="pointer-events-auto"
       >
         {slides.map((slide) => (
           <SwiperSlide
             key={slide.id}
-            className="!w-12 md:!w-16 cursor-pointer"
+            className="!w-14 md:!w-24 cursor-pointer"
           >
-            <div className="aspect-square overflow-hidden rounded-md ring-1 ring-white/20">
+            <div className="aspect-square overflow-hidden rounded-xl ring-2 ring-white/30 hover:ring-white/60 transition">
               <img
                 src={slide.thumb || slide.imageMobile}
                 alt={slide.title}
                 className="w-full h-full object-cover"
               />
             </div>
           </SwiperSlide>
         ))}
       </Swiper>
     </div>
   </div>
```

This bumps desktop thumb size from 64px → 96px (50% larger), increases spacing, beefier ring, hover state.

### Fix #4 — Hot games has no real images (updated from earlier Fix #2)

**Symptom (2026-05-13 002452 screenshot):** User circled the entire hot-games section in red — 6 placeholder boxes with text "Game N (Phase 7)" and NO images. User explicitly said "the images are missing, just like on that other website".

**This supersedes Fix #2 Option A.** Don't just balance the grid — implement real artwork.

**Required action — implement Phase 7 properly:**

#### Step A — Extract game data

The hot-games game list comes from `gameCenterData` defined in `mirror/games.wanmei.com/pc_gamecenter2104.js`. Each game entry has:
- `name` (Chinese name, e.g. "异环", "幻塔")
- `desc` (subtitle / 1-line description)
- `faceUrl` (large banner image URL — landscape ~3:2)
- `icon` (small square icon)
- `linkUrl` (target on click)
- `id`, `isView` (visibility flag)

**[CORRECTED 2026-05-13]** ~~Filter for `isView == true`, take the first 6–8 entries~~ — the local `pc_gamecenter2104.js` is **trimmed to 2 games** (line 3 comment: "Trimmed for local 2-game test: 异环 + 幻塔"). `hotGame.mobile` has 2 entries; other categories (`pc`, `danji`, `host`, `yeyou`) are empty. So you'll get 2 cards, not 6–8. With only 2 cards consider `md:grid-cols-2` rather than `md:grid-cols-3 lg:grid-cols-3`, or accept the lopsided row until upstream data is restored.

**[CORRECTED 2026-05-13]** ~~Make image URLs LOCAL paths (already in `mirror-staging/games.wanmei.com/...`)~~ — `gameCenterData` URLs are **remote CDN** (`gamesvmg.wmupd.com/...` and `games.wanmei.com/images/...`), NOT local. Session 2 established **hot-linking the CDN** as the standard pattern for upstream images (same as hero artwork from AD3/AD4). Keep CDN URLs as-is in `games.json`; revisit local rehosting at Phase 11 cutover.

**Data extraction is already done** — see `wanmei-next-app/data/games.json` (created in Session 2). Skip Step A; jump straight to Step B (build the component).

Example target schema (matches what's already in `data/games.json`):
```json
{
  "hotGame": {
    "mobile": [
      {
        "id": "20251",
        "name": "异环",
        "icon": "https://gamesvmg.wmupd.com/rms/common/yh260204-icon-200x200.png",
        "faceUrl": "https://gamesvmg.wmupd.com/rms/common/yh260423-770x441.jpg",
        "desc": "超自然都市开放世界",
        "link": "https://yh.wanmei.com/"
      }
    ]
  }
}
```

Note: actual JSON key is `link` (not `linkUrl`) — update the component skeleton accordingly.

#### Step B — Create the component

Create `wanmei-next-app/components/hot-games.tsx`:

```tsx
import games from "@/data/games.json";

export function HotGames() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 md:py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">热门游戏</h2>
      <p className="text-sm tracking-[0.3em] text-white/40 mb-6 md:mb-10">
        TRENDING GAMES
      </p>
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4 list-none p-0">
        {games.map((g) => (
          <li
            key={g.id}
            className="bg-[#1a1d22] rounded-lg overflow-hidden ring-1 ring-white/5 hover:ring-white/20 transition group"
          >
            <a
              href={g.linkUrl}
              target={g.linkUrl?.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="block"
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-black/30">
                <img
                  src={g.faceUrl}
                  alt={g.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="flex items-center gap-3 p-3 md:p-4">
                {g.icon && (
                  <img
                    src={g.icon}
                    alt=""
                    className="w-9 h-9 md:w-10 md:h-10 rounded-md object-cover shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm md:text-base text-white font-medium truncate">
                    {g.name}
                  </p>
                  {g.desc && (
                    <p className="text-xs text-white/60 truncate">{g.desc}</p>
                  )}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

#### Step C — Wire it into the page

In `app/page.tsx`, replace the entire hot-games placeholder section:

```diff
- {/* Hot games section — Phase 7 will implement */}
- <section className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 md:py-16">
-   <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
-     热门游戏
-   </h2>
-   <p className="text-sm tracking-[0.3em] text-white/40 mb-6 md:mb-10">
-     TRENDING GAMES
-   </p>
-   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
-     {[1, 2, 3, 4, 5, 6].map((i) => (
-       <div
-         key={i}
-         className="aspect-[3/2] bg-[#1a1d22] rounded-lg flex items-center justify-center text-white/30 text-xs"
-       >
-         Game {i} (Phase 7)
-       </div>
-     ))}
-   </div>
- </section>
+ <HotGames />
```

And add the import at the top:
```tsx
import { HotGames } from "@/components/hot-games";
```

### Order to apply these fixes

1. **Fix #1** (brand-tiles `relative`) — one line, 30 seconds
2. **Fix #3** (hero thumbnail strip larger) — one find/replace block in hero-carousel.tsx
3. **Fix #4** (hot games real artwork) — most work; extract data + create component + wire up
4. ~~Fix #2~~ — superseded by Fix #4; skip

After these, the visible state should match the user's expectations for: brand tiles (tall portrait), hero thumb strip (visible+clickable), hot games (real artwork).

### How to verify the fixes worked

1. After editing the two files, save them. Next.js dev server should hot-reload.
2. Open desktop browser at `http://localhost:3000/`. Brand tiles should be tall portrait, 4 across.
3. Hot games should now be 2 rows × 3 columns, balanced.
4. Resize browser to phone width (≤767px). Brand tiles become 2×2 grid (still squarish). Hot games becomes 2×3 grid.

---

---

## TL;DR (30 seconds) — [STALE 2026-05-12; see "Status as of 2026-05-13" above]

- We pivoted from CSS-overlay retrofit → full rebuild in Next.js 16 + Tailwind 4 + TS
- `wanmei-next-app/` exists with all Phase 1-3 scaffolding (Header, Footer, HeroCarousel, BrandBusiness, OfficialCommunity, page.tsx, layout.tsx, design tokens)
- 107 images already copied to `wanmei-next-app/public/images/` (~8.4 MB)
- ~~**`npm install` has NOT been run yet** — that's your first action~~ — DONE in Session 2
- Live `wanmeivn.com` is untouched and continues serving the old desktop mirror

## Hard rules (do not violate)

1. **Do not touch `mirror/`** (live site source) until Phase 11 atomic Caddy swap
2. **Do not change DNS, TLS, Caddy config** until Phase 11
3. **Preserve all upstream wanmei UI/UX/images** — only structural reflow via CSS, no asset replacement (per `feedback_preserve_all_assets` memory)
4. **Use staging-first workflow** — edit in `wanmei-next-app/`, dev server at `:3000`, user tests, THEN cutover
5. **For GitHub push: use `gh api`, not `git push`** — standard push hangs on this VPS. See `docs/github-commit-push-workflow.md`. PAT in `.secrets/github-pat-260512.txt` expires 2026-06-11
6. **Report session token %** at end of each response; warn at ≥88%

## First action when you start — [STALE; npm install already done in Session 2]

If `node_modules/` is somehow missing, run `npm install`. Otherwise jump straight to `npm run dev`.

```powershell
cd C:\web\web1\webgame\Webgame-main\wanmei-next-app
npm run dev
# Should print: ready - started server on http://localhost:3000
```

Then open `http://localhost:3000/` in a browser (use Chrome DevTools mobile emulator OR the user's real phone via `http://160.191.3.40:3000/` — note 3000 may need a firewall rule allow OR temporarily bind to `0.0.0.0`).

## What you should see when dev server runs — [UPDATED 2026-05-13]

| Section | Expected look |
|---------|---------------|
| Header | Sticky dark top bar. Desktop: logo + nav links + helps + lang. Mobile (<768px): logo + burger that opens drawer |
| Hero carousel | Swiper with **2** slides (real CDN artwork: 异环 + 幻塔, desktop landscape 1920×1035 / mobile portrait 750×1270). Small thumb strip overlay at bottom (Fix #3 wants this larger) |
| News section | `<NewsSection>` live: desktop = featured banner + vertical autoplay ticker (4 entries); mobile = featured banner + 2 stacked cards |
| Brand business | 4 tiles in a grid (2-col mobile, 4-col desktop). Real artwork from upstream brand-tile-0X.png — but currently sized wrong (Fix #1 wants `relative` on the `<a>`) |
| Hot games | 6 placeholder cards "Game N (Phase 7)" — no real images (Fix #4 wants the real `<HotGames>` component built from `games.json`) |
| Official community | 3 circular icons row (Weibo, Community, WeChat) |
| Footer | Centered legal links, ICP info, copyright |

If any of those look fundamentally wrong (e.g. zero styling, missing components), STOP and read `wanmei-next-app/PROGRESS.md` + `plans/260512-2330-wanmei-rebuild-nextjs/plan.md` to debug.

## What the user wants next — [UPDATED 2026-05-13]

In priority order:

### 1. ~~Phase 4 — Hero carousel polish~~ DONE 2026-05-12 s2
- `heroSlides.json` has 2 entries (异环, 幻塔) with real CDN URLs from AD3/AD4. Desktop 1920×1035 + mobile 750×1270 both present. Portrait-source open question is resolved (AD4 ships portraits). `<picture><source media="...">` pattern is wired.

### 2. ~~Phase 5 — News section~~ DONE 2026-05-12 s2
- `data/news.json` extracted from AD1/AD2/AD5. `<NewsSection>` component lives at `components/news-section.tsx`. Desktop 2-col (featured + vertical autoplay ticker), mobile stacked. Already added to `app/page.tsx`.

### 3. Visual fixes — pending (see "Immediate fixes" section at top of doc)
- Fix #1: brand-business `<a>` missing `relative` → tiles render wrong aspect
- Fix #3: hero thumb strip too small at desktop
- Fix #4: `<HotGames>` needs building (data already in `games.json`)

### 4. Phase 7 — Hot games (covered by Fix #4 above)

### 5. Phases 6, 8, 9, 10, 11 — see plan.md for details

## Files / locations to know

| Path | What |
|------|------|
| `plans/260512-2330-wanmei-rebuild-nextjs/plan.md` | **The master plan** — 11 phases, decisions locked, cutover steps |
| `plans/260512-2330-wanmei-rebuild-nextjs/brainstorm-table.md` | Why we chose Next.js+Tailwind, what's in/out of scope |
| `wanmei-next-app/PROGRESS.md` | Phase-by-phase progress tracker (this session updated it) |
| `wanmei-next-app/AGENTS.md` | Warning that Next.js 16 has breaking changes; read `node_modules/next/dist/docs/` before guessing APIs |
| `docs/github-commit-push-workflow.md` | How to push (use `gh api`, not `git push`) |
| `docs/deployment-260509-wanmeivn-apex.md` | Caddy config, DNS, TLS facts |
| `docs/session-handoff-2026-05-10-responsive-staging.md` | Yesterday's session about the CSS overlay attempt (now abandoned) |
| `.secrets/github-pat-260512.txt` | PAT (gitignored, expires 2026-06-11) |
| `.secrets/README.md` | PAT rotation/revocation instructions |

## Auto-memory pointers (already in `~/.claude/projects/.../memory/`)

| Memory | What it tells future you |
|--------|--------------------------|
| `project_wanmei_rebuild_plan` | This rebuild project; plan path; current **Phases 1-5 done**, Phase 7 pending |
| `reference_github_workflow` | PAT location + `gh api` push pattern |
| `workflow_staging_first` | Edit staging, test, then push — don't touch live |
| `workflow_devtools_debug` | When CSS doesn't work, ASK USER for DevTools output, don't guess |
| `feedback_preserve_all_assets` | Never replace upstream images/icons/sections |
| `feedback_session_token_reporting` | Report token usage at end of each response; warn at 88% |
| `project_homepage_state` | Full Wanmei content is intentional; rebrand to VN happens LATER, not now |
| `user_identities` | Two Gmail accounts, same person; don't propose cleanup |

## Known open questions (not blocking, but raise when relevant)

- [x] ~~Real hero artwork — where to source portrait versions?~~ **RESOLVED 2026-05-12 s2** — upstream `AD4` array ships portrait 750×1270 for both 异环 and 幻塔. Hot-linked from CDN; no portrait commissioning needed.
- [ ] Should the reservation popup (`pop_yy`) form actually do anything in v1, or is it legacy/decorative?
- [ ] Should the `.douliu_fixed` floating banner from upstream be preserved? (Phase 8 decision)
- [ ] When user wants to push to GitHub for the first time, walk through the workflow doc
- [ ] `pc_gamecenter2104.js` is trimmed to 2 games (yh + ht). Restore full upstream game list later? — see [[project_homepage_state]] memory.

## Don't do these things

- ❌ Don't run `npx serve mirror-staging -p 8080` again — that's already running (PID 9452) and the user's old `/m/` mobile mirror lives there as the fallback
- ❌ Don't rerun `npx create-next-app` — the project exists
- ❌ Don't go back to editing `mirror-staging/responsive-overlay.css` — that approach was abandoned. The `.bak` is preserved for rollback purposes only
- ❌ Don't try `git push` from PowerShell — it WILL hang. Use `gh api` Git Data API per workflow doc

## How to verify everything is healthy at start

```powershell
# Live PC site still up:
Invoke-WebRequest https://wanmeivn.com/ -Method Head -UseBasicParsing | Select-Object StatusCode, @{n='Server';e={$_.Headers.Server}}
# Expect: 200, Caddy

# Old staging still up:
Invoke-WebRequest http://160.191.3.40:8080/ -Method Head -UseBasicParsing | Select-Object StatusCode
# Expect: 200

# Mobile mirror at /m/ still up:
Invoke-WebRequest http://160.191.3.40:8080/m/ -Method Head -UseBasicParsing | Select-Object StatusCode
# Expect: 200

# New Next.js app folder exists:
Test-Path C:\web\web1\webgame\Webgame-main\wanmei-next-app\app\page.tsx
# Expect: True

# GitHub auth (after loading PAT):
$env:GH_TOKEN = (Get-Content C:\web\web1\webgame\Webgame-main\.secrets\github-pat-260512.txt).Trim()
gh auth status
# Expect: ✓ Logged in to github.com account BlackCat-Ent-Studio (GH_TOKEN)
```

## If user says "continue" or "keep going" — [UPDATED 2026-05-13]

Default interpretation: apply the 3 outstanding visual fixes (Fix #1 brand-tile `relative`, Fix #3 hero thumb strip, Fix #4 build `<HotGames>` properly). Dev server is already running; no install needed.

If user says something more specific (e.g., "fix the news section"), do that and skip ahead.

## Final sanity reminders

1. **CSS overlay approach is DEAD** — `mirror-staging/responsive-overlay.css` is rollback insurance only; don't touch it
2. **`mirror-staging/m/` mobile mirror is DEAD** — same, rollback only; the rebuild replaces it
3. **The single-URL responsive design lives in `wanmei-next-app/`** — that's the only thing being actively developed
4. **Don't push anything to GitHub until** Phase 1-3 work has been tested in the dev server AND user explicitly says "push"
