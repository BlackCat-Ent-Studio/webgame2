# wanmei-next-app — Build Progress

> Live tracker of phase completion. Resume next session via `/ck:cook plans/260512-2330-wanmei-rebuild-nextjs/plan.md`.

## ✅ Phase 1: Foundation (DONE)

- [x] Next.js 16.2.6 scaffolded with App Router, TypeScript, Tailwind 4
- [x] `output: 'export'` enabled in `next.config.ts` (for Caddy static serve)
- [x] Dark wanmei palette + design tokens in `app/globals.css`
- [x] Root layout with viewport meta + Vietnamese lang
- [x] `package.json` updated with deps: `swiper`, `next-intl`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`
- [x] `lib/utils.ts` with `cn()` helper
- [x] **PENDING:** `npm install` — run this BEFORE Phase 4 work resumes (deferred to save tokens this session)

## ✅ Phase 2: Asset migration (DONE)

- [x] Copy upstream wanmei images into `public/images/`:
  - `common/` (59 files, 5.4 MB) — chrome, logos, section titles, hero arrows
  - `brand/` (10 files, 1.2 MB) — brand tile artwork (4 tiles × 2 states + extras)
  - `community/` (3 files, 60 KB) — social icons (Weibo, WeChat, Douliu)
  - `mobile/` (35 files, 2.0 MB) — wanmei.com/m/ assets (header-img.jpg, business tiles, popups)
- [x] Data JSON files: `heroSlides.json`, `brands.json`, `community.json`, `nav.json`
- [x] **Extracted** `gameCenterData` → `games.json` (2026-05-12 session 2)
- [x] **Extracted** `games_data_data.AD1/AD2/AD3/AD4/AD5` → `news.json` + updated `heroSlides.json` (2026-05-12 session 2)
- [x] **Hero artwork sourced** — AD3 provides desktop 1920×1035, AD4 provides mobile portrait 750×1270 for both 异环 + 幻塔. Hot-linked from `gamesvmg.wmupd.com` CDN (200 OK from VPS, no referer block). Landscape-crop fallback NOT needed.

## ✅ Phase 3: Layout shell (DONE)

- [x] `<Header>` component at `components/header.tsx`:
  - Desktop: logo + nav row + helps + language switcher (≥768px)
  - Mobile: logo + burger button + slide-down drawer (<768px)
  - Sticky top, dark backdrop
- [x] `<Footer>` component at `components/footer.tsx`: centered stacked links + legal text
- [x] `<HeroCarousel>` at `components/hero-carousel.tsx`: Swiper React, dual-image via `<picture>`, thumb strip
- [x] `<BrandBusiness>` at `components/brand-business.tsx`: 2-col mobile / 4-col desktop grid
- [x] `<OfficialCommunity>` at `components/official-community.tsx`: 3 circular icons row
- [x] `app/page.tsx` composes everything with placeholder sections for Phases 5 + 7

## ⏳ Phases 4-11 (remaining)

| # | Phase | Status |
|---|-------|--------|
| 4 | Hero carousel (real CDN URLs wired, autoplay) | **DONE 2026-05-12 s2** — prev/next buttons deferred. **+ Info-card overlay 1:1 upstream (desktop AD3 + mobile AD4) 2026-05-13** |
| 5 | News section (Swiper vertical autoplay ticker) | **NEEDS REDO 2026-05-13** — current desktop branch is wrong (multiple failed guess-and-check iterations). See `plans/260512-2330-wanmei-rebuild-nextjs/news-section-exact-port.md` for the 1:1 upstream port spec. Mobile branch is fine. |
| 6 | Brand business polish | **DONE 2026-05-13** — stripped redundant overlay text, added mobile picture/source swap to upstream `business-item*.png`, fixed title/link mapping |
| 7 | Hot games | **DONE 2026-05-13** — 2-col grid all breakpoints, banner+caption upstream pattern, NTE-band crop via transform scale on 异环 image (per-image opt-in via `faceCropBottomPct` field) |
| 4.5 | Page background (PC + mobile) | **DONE 2026-05-13** — body bg-image swap per breakpoint matching upstream `.bg` wrapper + `/m/ #swiper-container1` repeat-y |
| 8 | Popups (WeChat QR, reservation form, video) | Not started |
| 9 | i18n scaffolding (next-intl) | Not started |
| 10 | QA + cross-device test | Not started |
| 11 | Cutover (build → mirror-next/ → Caddy swap) | Not started |

## Session 2 (2026-05-12 resume) notes

- `npm install` clean (75 packages, 0 errors). Dev server `:3000` returns 200.
- Hero CDN reachable from VPS (no 403). Hot-link strategy validated; can revisit at Phase 11 if needed.
- Hero slide count reduced 3 → 2 to match upstream AD3/AD4 (yh + ht only). Old `douliu` / `zhuxian` placeholders removed — they weren't in upstream data.
- Workspace-root warning about parent `package-lock.json` not silenced (cosmetic, can set `turbopack.root` in `next.config.ts` later).
- One non-blocking warning at install: 3 vulnerabilities (2 mod, 1 crit) — `npm audit fix --force` deferred until Phase 10 QA so we don't churn deps mid-development.

## How to resume

In next session:

```powershell
cd C:\web\web1\webgame\Webgame-main\wanmei-next-app
npm run dev   # node_modules already installed
```

Open `http://localhost:3000/` — should now see real wanmei hero + real news ticker.

**Next priorities (Phase 7 onward):**
1. Phase 7 — build `<HotGames>` component (data ready in `games.json`)
2. Phase 6 — brand-business polish (hover states, real wanmei tile interactions)
3. Phase 8 — popups: decide fate of `pop_yy` reservation form and `.douliu_fixed` floating banner
4. Phase 9 — extract hardcoded strings → `i18n/messages/zh-CN.json`
5. Phase 10 — cross-device QA
6. Phase 11 — build + Caddy cutover

Resume command:

```
/ck:cook plans/260512-2330-wanmei-rebuild-nextjs/plan.md
```
