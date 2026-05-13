# Wanmei Mirror — Patches Log

Modifications applied by `scripts/mirror-wanmei-homepage.mjs` between fetching `https://games.wanmei.com/` and writing `mirror/index.html`. Stage 2 must re-engineer cleanly without these patches — this doc tells Stage 2 *what was changed and why*.

## Patch 1 — `isMobile.js` import removed

**Why:** Source HTML has:
```html
<script src="https://static.games.wanmei.com/public/js/isMobile.js"></script>
<script>
  if(isMobile()){ location.href = 'https://games.wanmei.com/m/index.html'; }
</script>
```
On a phone, this redirects users away from the mirror to the live wanmei mobile site. Kills local testing.

**Patch:** Both the external script tag and the inline `if(isMobile()){...}` redirect block are replaced with HTML comments:
```html
<!-- isMobile script removed (Stage 1 mirror) -->
<!-- isMobile redirect block removed (Stage 1 mirror) -->
```

**Stage 2 path:** Build a properly responsive site (Tailwind breakpoints / CSS media queries). No UA sniffing.

## Patch 2 — `stat.js` analytics stripped

**Why:** Source loads wanmei's first-party analytics tracker:
```html
<script src="https://static.games.wanmei.com/public/js/stat.js"></script>
```
The mirror doesn't need to ping wanmei analytics from `localhost`. Cleaner console + no third-party requests during local testing.

**Patch:** Tag replaced with HTML comment:
```html
<!-- stat.js removed (Stage 1 mirror) -->
```

**Stage 2 path:** Decide on analytics provider for the rebuild (e.g. Cloudflare Web Analytics, Plausible, none).

## URL Rewriting (not strictly a patch, but a transform)

All absolute URLs in `<link href>`, `<script src>`, `<img src>`, `<source srcset>`, and CSS `url(...)` are rewritten from `https://{host}/path` to `./{host}/path` (relative) so the mirror serves cleanly under any local file-server URL.

**Excluded from rewriting:**
- `<a href>` outbound links — kept absolute per Stage 1 spec ("clicking a game card may go to live site")
- URLs inside JS string literals (e.g. `bigpic` fields in `games_data_data.AD3`) — these still hotlink to `gamesvmg.wmupd.com`
- URLs inside HTML comments (e.g. the commented-out `<!-- 新游推荐 -->` block) — inert, browser ignores them

## Tolerated 404s (NOT patches — runtime artifacts)

Three decorative PNGs return 404 from wanmei itself. Mirror logs them but does not retry:
- `images/index2103/sub_succ_bg.png`
- `images/index2103/succ_draw_tit.png`
- `images/index2103/douliu_pop_bg.png`

All are reservation-success popup ornamentation — never visible during normal homepage interaction.

## Verification (Phase 02)

After patches applied:
- 0 console errors except `favicon.ico` 404 (cosmetic, not from wanmei)
- 0 broken images out of 88 loaded
- All 4 carousels render and animate
- Mobile UA test confirms no redirect

See `plans/260507-2044-wanmei-local-mirror/visuals/mirror-homepage-1920x1080.png` for visual proof.
