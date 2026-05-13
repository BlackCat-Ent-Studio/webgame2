# Wanmei Mirror — Asset Inventory

Snapshot from `mirror/` after first successful run of `scripts/mirror-wanmei-homepage.mjs`.

- **Source:** `https://games.wanmei.com/`
- **Captured:** 2026-05-07
- **Total size:** 8.1 MB across 80 files
- **Hosts mirrored:** `games.wanmei.com` (68 files), `static.games.wanmei.com` (11 files)

## Breakdown

| Type | Count |
|---|---|
| HTML | 1 (`index.html`, patched) |
| JavaScript | 11 |
| CSS | 5 |
| Images (PNG/JPG) | 62 |
| Fonts | 0 (system fonts used) |

## JavaScript Files

| Path | Size | Role |
|---|---:|---|
| `static.games.wanmei.com/public/js/jq_183.js` | 93,636 | jQuery 1.8.3 |
| `static.games.wanmei.com/public/js/swiper-4.5.0.min.js` | 127,934 | Swiper 4.5 |
| `static.games.wanmei.com/public/js/swiper.animate1.0.2.min.js` | 1,708 | Swiper animate plugin |
| `static.games.wanmei.com/public/js/jquery.boxy.js` | 14,644 | Modal/dialog |
| `static.games.wanmei.com/public/js/isMobile.js` | 367 | Mobile UA sniff (PATCHED OUT) |
| `static.games.wanmei.com/public/js/stat.js` | 58,554 | Analytics (STRIPPED) |
| `static.games.wanmei.com/games/xxa/jquery.cookie.js` | 3,121 | Cookie helper |
| `static.games.wanmei.com/public/js/top/loadGameData.js` | 4,493 | Game catalog data |
| `static.games.wanmei.com/public/commonData/gamesData/gameSwiper/games-gameSwiper.js` | 18,136 | Carousel + news data |
| `games.wanmei.com/js/yy2103.js` | 2,877 | Reservation popup logic |
| `games.wanmei.com/pc_gamecenter2104.js` | 55,260 | Page bootstrap + game list rendering |

## CSS Files

| Path | Size | Role |
|---|---:|---|
| `static.games.wanmei.com/public/style/swiper-4.5.0.min.css` | 19,778 | Swiper styles |
| `static.games.wanmei.com/public/style/animate.min.css` | 61,353 | animate.css |
| `games.wanmei.com/style/yy2103.css` | 8,071 | Reservation popup |
| `games.wanmei.com/style/index2104_2209.css` | 25,971 | Page layout |
| `games.wanmei.com/style/index230418.css` | 6,638 | Page layout patches |

## Images

62 PNG/JPG files under:
- `games.wanmei.com/images/index2103/` — hero, brand tiles, popup decorations
- `games.wanmei.com/images/index2205/` — refreshed hero/branding (logo, nav)
- `games.wanmei.com/images/common1711/` — logo
- `games.wanmei.com/font-family/`, `games.wanmei.com/m/` — minor

## Known 404s on Mirror

3 decorative PNGs return 404 from wanmei (genuinely missing on their CDN):
- `games.wanmei.com/images/index2103/sub_succ_bg.png`
- `games.wanmei.com/images/index2103/succ_draw_tit.png`
- `games.wanmei.com/images/index2103/douliu_pop_bg.png`

These are reservation-success popup decorations — invisible during normal homepage browsing.

## Hotlinked Assets (NOT mirrored)

The carousel JSON (`games-gameSwiper.js`) embeds **absolute** URLs to a 3rd CDN host: `gamesvmg.wmupd.com`. Hero/news images load from there at runtime. Mirror works as long as wanmei keeps serving them. If we want full offline/Cloudflare independence in Stage 2, must:

1. Add `gamesvmg.wmupd.com` to mirror script `HOSTS` set
2. Rewrite URLs inside the JSON-in-JS file (more complex — JS string parsing)
