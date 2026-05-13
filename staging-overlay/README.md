# Staging overlay — responsive retrofit WIP

> ⚠️ **DO NOT copy these files into `mirror/` without explicit user permission.**
> This folder contains work-in-progress responsive overlay that has NOT been
> approved for the live `https://wanmeivn.com/` site. Live deploy gated on
> user/boss approval.
>
> See `docs/session-handoff-2026-05-10-responsive-staging.md` for full context.

## What's in here

Just the **files that differ** between live (`mirror/`) and our staging
experiments. Everything else under `mirror-staging/` on the dev box is
byte-identical to `mirror/`.

| File | Difference vs `mirror/` |
|---|---|
| `index.html` | Adds viewport meta, cache-buster query string on CSS link, inline `<style>` block with surgical responsive overrides, JS Swiper-killer at end of body |
| `responsive-overlay.css` | NEW — fluid layout overrides for legacy upstream CSS (~13 KB) |

## How to set up local staging on a new machine

1. **Clone the repo** (this one):
   ```bash
   git clone https://github.com/BlackCat-Ent-Studio/Webgame
   cd Webgame
   ```

2. **Reproduce the static mirror content** (since `mirror/` itself is mostly
   gitignored except files we force-added):
   ```bash
   npm install
   node scripts/mirror-wanmei-homepage.mjs
   node scripts/rename-mirror-images.mjs
   ```
   (or just copy `mirror/` from this repo if its content is committed)

3. **Create a staging copy**:
   ```bash
   cp -r mirror mirror-staging
   ```

4. **Layer the overlay files**:
   ```bash
   cp staging-overlay/index.html              mirror-staging/index.html
   cp staging-overlay/responsive-overlay.css  mirror-staging/responsive-overlay.css
   ```

5. **Serve it on a separate port** (port 80/443 reserved for live):
   ```bash
   npx serve mirror-staging -p 8080
   ```

6. Open `http://localhost:8080/` (or `http://YOUR_VPS_IP:8080/` if remote).

7. Iterate on `responsive-overlay.css` and the inline `<style>` in `index.html`.
   When user explicitly approves "deploy to live", copy these two files over
   `mirror/` and push the changes.

## Current verified-working features

- ✅ Brand-business tiles (品牌业务) — fluid CSS Grid, reflows continuously
- ✅ Hero swiper thumbnails (`.productCarousel-thumbs`) — `position: relative` on
  mobile so they appear below hero instead of off-screen at top:800px
- ✅ Viewport meta tag — mobile browsers stop zooming out
- ✅ HTTP→HTTPS redirect, HSTS, Cache-Control headers (these are on Caddy, already live)

## Still WIP — sections that need similar surgical fixes

- `.hot_games_list` (热门游戏 grid)
- `.newgame_list` (新游推荐)
- `.offical_list` (客户端游戏)
- `.cv_swiper` (news ticker)
- `.top_box` / `.top_nav_ul` (top nav at narrow widths)
- Inner content of hero swiper text overlays at narrow widths

## Approach for fixing each next section (DevTools first)

**Don't write CSS by guessing selectors.** Use Chrome DevTools to verify the
exact DOM the section renders, then audit upstream CSS, then write a surgical
override. See full workflow + brand-tiles lesson in
`docs/session-handoff-2026-05-10-responsive-staging.md`.

Quick console snippet to validate any selector before writing CSS for it:

```js
const sel = '.your-section-here';
const el = document.querySelector(sel);
console.log(sel, '→', el ? 'EXISTS' : 'NULL');
if (el) {
  console.log('parent:', el.parentElement.className);
  const cs = getComputedStyle(el);
  console.log({display: cs.display, width: cs.width, height: cs.height,
               position: cs.position});
  console.log('inline style:', el.getAttribute('style'));
}
```

If the selector returns NULL, you're targeting the wrong thing. Look at the
visible element's actual class chain in Elements panel.

## Critical: deploy gate

Until user explicitly says "deploy to live" / "sync to mirror" / equivalent:

- **Do NOT** copy `staging-overlay/index.html` over `mirror/index.html`
- **Do NOT** push a commit that modifies anything inside `mirror/`
- **Do NOT** assume "looks fine in staging" means "ready for live"

This rule is written deliberately at the top of every relevant doc. Honor it.
