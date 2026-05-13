---
type: brainstorm-summary
date: 2026-05-08
author: brainstormer
slug: trim-homepage-to-2-games
status: agreed
---

# Brainstorm — Trim Homepage to 2 Games

## Problem
Homepage mirror currently advertises ~45 game touchpoints (16 client + 25 mobile + 1 webgame + 3 platforms + 14 hero + 10 news). User has only 2 games to test; need page collapsed to those 2 everywhere.

## Picks
- **异环** (yh.wanmei.com) — current top hero slide, mobile RPG
- **幻塔** (ht.wanmei.com) — flagship mobile, hero asset present

## Inventory of Game Touchpoints
| # | Surface | File | Now | After |
|---|---|---|---|---|
| 1 | Hero carousel (AD3) | games-gameSwiper.js | 14 | 2 |
| 2 | Hero thumb strip (mirrors AD3) | same | 14 | 2 |
| 3 | News ticker (AD1) | same | 10 | 0–2 |
| 4 | Catalog drawer client | loadGameData.js | 16 | 0 |
| 5 | Catalog drawer mobiel | same | 25 | 2 |
| 6 | Catalog drawer webgame | same | 1 | 0 |
| 7 | Catalog drawer other | same | 3 | 0 |
| 8 | Catalog drawer cate (loaded, unrendered) | same | 5 | 0 |
| 9 | Loaded-but-unused AD2/4/5 | games-gameSwiper.js | 11/14/11 | 0 |
| 10 | Hardcoded game `<a href>` in index.html | index.html | **0** | 0 |

Sweep confirmed: zero per-game links in HTML — all flow through JS data.

## Approaches Evaluated
- **A. Data-only edits (CHOSEN)** — edit two JS files; HTML untouched. Lowest blast radius, KISS.
- **B. CSS hide + minimal data** — hide DOM regions, render 2 cards inline. Rejected: layout fragility, more work, no benefit.
- **C. Custom landing page** — replace index.html body. Rejected: defeats Stage 1 mirror premise.

## Final Solution
Edit 2 files:
1. `mirror/static.games.wanmei.com/public/js/top/loadGameData.js`
   - `mobiel` → `[yh, ht]`; `client/cate/webgame/other` → `[]`
2. `mirror/static.games.wanmei.com/public/commonData/gamesData/gameSwiper/games-gameSwiper.js`
   - `AD3` → `[yh slide, ht slide]` (keep current asset URLs)
   - `AD1` → keep yh/ht news only (likely 1 yh entry; rest emptied)
   - `AD2/AD4/AD5` → `[]`

## Implementation Considerations
- **Swiper loop quirk**: 2 slides + `loop:true` may duplicate. Mitigation: set `loop:false` in init if visual glitch appears (1-line edit in index.html or related JS).
- **No HTML edits required**.
- **Refetch** (`scripts/mirror-wanmei-homepage.mjs`) overwrites both files; user accepts throwaway model — no patch script needed.
- **Existing assets**: yh/ht hero images already in mirror/. No re-download.

## Risks
- **Low**: AD3 slide ordering — verify yh + ht are slides 0–1 in current capture before pruning.
- **Low**: AD1 news may have no ht entry → ticker shows 0–1 items; cosmetic.
- **None**: HTML, CSS, layout untouched; no regression vectors there.

## Success Criteria
1. Mega-menu drawer shows only 异环 + 幻塔 under 手机游戏; other tabs empty.
2. Hero carousel cycles 异环 ↔ 幻塔 only.
3. Every clickable game tile/slide links to `yh.wanmei.com` or `ht.wanmei.com`.
4. News ticker empty or shows yh/ht items only.
5. No console errors at http://localhost:3000/.

## Effort
~10–15 min edits + manual eyeball validation.

## Plan
See `plans/260508-1617-trim-homepage-to-2-games/plan.md`.

## Unresolved Questions
- None.
