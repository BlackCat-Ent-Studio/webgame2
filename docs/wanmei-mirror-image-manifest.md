---
title: Wanmei Mirror — Image Manifest
date: 2026-05-07
generated_by: scripts/rename-mirror-images.mjs
total_images: 61
---

# Wanmei Mirror — Image Manifest

All 61 mirrored chrome images on the homepage, with semantic name + role.

> **To swap an image:** drop a replacement file with the **same filename** at the same path. The HTML / CSS / JS references are already wired to the new names — no edits needed.

## Naming convention

`<section>-<role>[-<index>][-<state>].<ext>`

| Prefix | Section |
|---|---|
| `nav-` | Top navigation bar (logo, language switcher, active strip) |
| `hero-` | Main fade carousel (slides, thumbnails, arrows, info card) |
| `news-` | Vertical news ticker + image preview tabs |
| `brand-` | 4 promo brand tiles |
| `gamelist-` | Mega-menu drawer game catalog |
| `section-title-` | Pre-rasterised section heading text |
| `social-` | Bottom social-media icons (Weibo / WeChat / Douliu) |
| `popup-yy-` | Reservation popup (yy = 预约 / yuyue) — form, success, end states |
| `popup-video-` | Video popup mask |
| `popup-close` | Generic close (X) button |
| `chrome-` | Generic page chrome (dividers, page bg, floating banner) |
| `newgame-` | Newgame recommendation block (assets exist, HTML block currently commented out) |

---

## 🧭 Top Navigation

| New name | Was | Where it appears | Path |
|---|---|---|---|
| `nav-logo.png` | `logo.png` | Header — primary site logo | `mirror/games.wanmei.com/images/common1711/nav-logo.png` |
| `nav-logo-main.png` | `logo.png` (in `index2205/main/`) | Header — refreshed 2022 logo (overrides primary at runtime) | `mirror/games.wanmei.com/images/index2205/main/nav-logo-main.png` |
| `nav-logo-footer.png` | `logo.png` (in `index2103/`) | Footer logo | `mirror/games.wanmei.com/images/index2103/nav-logo-footer.png` |
| `nav-bg.png` | `nav_bg.png` | Top nav background strip | `mirror/games.wanmei.com/images/index2103/nav-bg.png` |
| `nav-active.png` | `nav_active.png` | Top nav active-item underline | `mirror/games.wanmei.com/images/index2103/nav-active.png` |
| `nav-lang-flag.png` | `iscountry.png` | Language switcher flag/marker | `mirror/games.wanmei.com/images/index2103/nav-lang-flag.png` |

## 🎠 Hero Carousel

| New name | Was | Where it appears | Path |
|---|---|---|---|
| `hero-arrow-prev.png` | `prev_btn.png` | Previous arrow button | `mirror/games.wanmei.com/images/index2103/hero-arrow-prev.png` |
| `hero-arrow-next.png` | `next_btn.png` | Next arrow button | `mirror/games.wanmei.com/images/index2103/hero-arrow-next.png` |
| `hero-bullet-off.png` | `bullet.png` | Pagination bullet (inactive) | `mirror/games.wanmei.com/images/index2103/hero-bullet-off.png` |
| `hero-bullet-on.png` | `bullet_on.png` | Pagination bullet (active) | `mirror/games.wanmei.com/images/index2103/hero-bullet-on.png` |
| `hero-frame.png` | `kuang.png` | Image frame/border overlay | `mirror/games.wanmei.com/images/index2103/hero-frame.png` |
| `hero-arrow-icon.png` | `arrow_icon.png` | Info-card arrow icon | `mirror/games.wanmei.com/images/index2103/hero-arrow-icon.png` |
| `hero-arrow-icon-alt.png` | `arrow_icon2.png` | Info-card arrow icon (alt) | `mirror/games.wanmei.com/images/index2103/hero-arrow-icon-alt.png` |
| `hero-product-line.png` | `product_line.png` | Info-card divider line | `mirror/games.wanmei.com/images/index2205/hero-product-line.png` |
| `hero-info-more-btn.png` | `box1_game1_more_btn.png` | Info-card "more details" button | `mirror/games.wanmei.com/images/index2205/box1_gamg1/hero-info-more-btn.png` |
| `hero-slogan.png` | `slogan.png` | Pre-rasterised hero slogan text | `mirror/games.wanmei.com/images/index2103/hero-slogan.png` |

## 📰 News Section

| New name | Was | Where it appears | Path |
|---|---|---|---|
| `section-title-news.png` | `title1.png` | Section heading: 新闻动态 | `mirror/games.wanmei.com/images/index2103/section-title-news.png` |
| `news-tab-bg-off.png` | `tab_bg.png` | News ticker tab background (inactive) | `mirror/games.wanmei.com/images/index2103/news-tab-bg-off.png` |
| `news-tab-bg-on.png` | `tab_bg_on.png` | News ticker tab background (active) | `mirror/games.wanmei.com/images/index2103/news-tab-bg-on.png` |
| `news-more-btn.png` | `more_btn.png` | "More news" button (default) | `mirror/games.wanmei.com/images/index2103/news-more-btn.png` |
| `news-more-btn-on.png` | `more_btn_on.png` | "More news" button (hover) | `mirror/games.wanmei.com/images/index2103/news-more-btn-on.png` |

## 🟦 Brand Grid (4 promo tiles)

| New name | Was | Where it appears | Path |
|---|---|---|---|
| `section-title-brand.png` | `title2.png` | Section heading: 品牌业务 | `mirror/games.wanmei.com/images/index2103/section-title-brand.png` |
| `brand-more.png` | `brand_more.png` | "View more brands" button | `mirror/games.wanmei.com/images/index2103/brand-more.png` |
| `brand-tile-01.png` | `brand1.png` | Tile 1 (default) | `mirror/games.wanmei.com/images/index2103/brand-tile-01.png` |
| `brand-tile-01-hover.png` | `brand1_on.png` | Tile 1 (hover) | `mirror/games.wanmei.com/images/index2103/brand-tile-01-hover.png` |
| `brand-tile-02.png` | `brand2.png` | Tile 2 (default) | `mirror/games.wanmei.com/images/index2103/brand-tile-02.png` |
| `brand-tile-02-hover.png` | `brand2_on.png` | Tile 2 (hover) | `mirror/games.wanmei.com/images/index2103/brand-tile-02-hover.png` |
| `brand-tile-03.png` | `brand3.png` | Tile 3 (default) | `mirror/games.wanmei.com/images/index2103/brand-tile-03.png` |
| `brand-tile-03-hover.png` | `brand3_on.png` | Tile 3 (hover) | `mirror/games.wanmei.com/images/index2103/brand-tile-03-hover.png` |
| `brand-tile-04.png` | `brand4.png` | Tile 4 (default) | `mirror/games.wanmei.com/images/index2103/brand-tile-04.png` |
| `brand-tile-04-hover.png` | `brand4_on.png` | Tile 4 (hover) | `mirror/games.wanmei.com/images/index2103/brand-tile-04-hover.png` |
| `brand-tile-05.png` | `brand5.png` | Tile 5 (default — currently unused on page) | `mirror/games.wanmei.com/images/index2103/brand-tile-05.png` |
| `brand-tile-05-hover.png` | `brand5_on.png` | Tile 5 (hover) | `mirror/games.wanmei.com/images/index2103/brand-tile-05-hover.png` |

## 🆕 Newgame Block (currently commented out, assets exist)

| New name | Was | Where it appears | Path |
|---|---|---|---|
| `section-title-newgame.png` | `title3.png` | Section heading: 新游推荐 | `mirror/games.wanmei.com/images/index2103/section-title-newgame.png` |
| `section-title-04.png` | `title4.png` | Section heading 4 (use TBD) | `mirror/games.wanmei.com/images/index2103/section-title-04.png` |
| `section-title-social.png` | `title5.png` | Section heading: 官方社群 | `mirror/games.wanmei.com/images/index2103/section-title-social.png` |
| `newgame-change-btn.png` | `change_btn.png` | "Change recommendation" button | `mirror/games.wanmei.com/images/index2103/newgame-change-btn.png` |
| `newgame-features-right.png` | `features_right.png` | Right-panel decoration | `mirror/games.wanmei.com/images/index2103/newgame-features-right.png` |
| `newgame-mask.png` | `newgame_mask.png` | Image mask overlay | `mirror/games.wanmei.com/images/index2103/newgame-mask.png` |

## 🎮 Game Catalog (mega-menu drawer)

| New name | Was | Where it appears | Path |
|---|---|---|---|
| `gamelist-bg.png` | `game_list_bg.png` | Drawer background | `mirror/games.wanmei.com/images/index2103/gamelist-bg.png` |
| `gamelist-hot-badge.png` | `hot_bg.png` | "Hot" badge on game items | `mirror/games.wanmei.com/images/index2103/gamelist-hot-badge.png` |

## 🔗 Social Strip

| New name | Was | Where it appears | Path |
|---|---|---|---|
| `social-weibo.png` | `weibo_icon.png` | Weibo (微博) icon | `mirror/games.wanmei.com/images/index2103/social-weibo.png` |
| `social-wechat.png` | `wx_iocn.png` | WeChat (微信) icon — fixes original "iocn" typo | `mirror/games.wanmei.com/images/index2103/social-wechat.png` |
| `social-douliu.png` | `douliu_icon.png` | Douliu community icon | `mirror/games.wanmei.com/images/index2103/social-douliu.png` |

## 🪟 Reservation Popup (yy = 预约 / yuyue)

| New name | Was | Where it appears | Path |
|---|---|---|---|
| `popup-yy-bg-form.png` | `popbg.png` | Form-state background | `mirror/games.wanmei.com/images/index2103/popup-yy-bg-form.png` |
| `popup-yy-bg-success.png` | `popbg_succ.png` | Success-state background | `mirror/games.wanmei.com/images/index2103/popup-yy-bg-success.png` |
| `popup-yy-bg-end.png` | `popbg_end.png` | End / finished-state background | `mirror/games.wanmei.com/images/index2103/popup-yy-bg-end.png` |
| `popup-yy-submit-btn.png` | `yy_btn.png` | Submit button (default) | `mirror/games.wanmei.com/images/index2103/popup-yy-submit-btn.png` |
| `popup-yy-submit-btn-on.png` | `yy_btn_on.png` | Submit button (hover) | `mirror/games.wanmei.com/images/index2103/popup-yy-submit-btn-on.png` |
| `popup-yy-game-title.png` | `yy_gametit.png` | Game title image | `mirror/games.wanmei.com/images/index2103/popup-yy-game-title.png` |
| `popup-yy-color-bar.png` | `color_bar.png` | Success-state colour-bar decoration | `mirror/games.wanmei.com/images/index2103/popup-yy-color-bar.png` |
| `popup-yy-success-title.png` | `succ_yy_tit.png` | "Thank you" title | `mirror/games.wanmei.com/images/index2103/popup-yy-success-title.png` |
| `popup-yy-success-ok-btn.png` | `suc_ok_btn.png` | Success OK button | `mirror/games.wanmei.com/images/index2103/popup-yy-success-ok-btn.png` |
| `popup-yy-douliu-info.png` | `douliu_info.png` | Douliu QR / info block | `mirror/games.wanmei.com/images/index2103/popup-yy-douliu-info.png` |
| `popup-close.png` | `close.png` | Generic close (X) — PNG | `mirror/games.wanmei.com/images/index2103/popup-close.png` |
| `popup-close-alt.jpg` | `close.jpg` | Generic close (X) — JPG variant | `mirror/games.wanmei.com/images/index2103/popup-close-alt.jpg` |

## 🎬 Video Popup

| New name | Was | Where it appears | Path |
|---|---|---|---|
| `popup-video-mask.png` | `video_mask.png` | Dark overlay behind video | `mirror/games.wanmei.com/images/index2103/popup-video-mask.png` |

## 🎨 Page Chrome / Misc

| New name | Was | Where it appears | Path |
|---|---|---|---|
| `chrome-page-bg.jpg` | `bg34.jpg` | Page-wide background texture | `mirror/games.wanmei.com/images/index2103/chrome-page-bg.jpg` |
| `chrome-divider.png` | `line.png` (in `index2103/`) | Section divider line | `mirror/games.wanmei.com/images/index2103/chrome-divider.png` |
| `chrome-divider-line.png` | `line.png` (in `common1711/`) | Header divider strip | `mirror/games.wanmei.com/images/common1711/chrome-divider-line.png` |
| `chrome-float-banner.png` | `fbh_float.png` | Floating right-side promo banner | `mirror/games.wanmei.com/images/index2103/chrome-float-banner.png` |

## 📱 Mobile-Only (skipped)

| New name | Was | Notes |
|---|---|---|
| *(not renamed)* | `m/images/main/btn-play.png` | Lives outside the `/images/` tree, invisible on desktop. Skipped — low priority. |

---

## How to swap an image

When you want to replace something, just say either the **new filename** or the **role**.

| What you say | What I do |
|---|---|
| *"Replace `brand-tile-02.png` with this file"* (with attachment) | Save your file to `mirror/games.wanmei.com/images/index2103/brand-tile-02.png` (overwrites). Page picks it up immediately. |
| *"Swap the WeChat icon for `D:/icons/new-wechat.png`"* | Same — copies to the `social-wechat.png` location. |
| *"Replace the hero arrows"* | I'll need both files (prev + next) — I'll ask which goes where. |
| *"Replace all 4 brand tiles with these"* (4 attachments) | Maps each to `brand-tile-0{1,2,3,4}.png` in default state; ask separately for hover variants if needed. |

## NOT in this manifest (still hotlinked)

These images are **NOT** local files yet — they hotlink to wanmei's CDNs at runtime:

- **Hero campaign artwork** — big background images you see in the carousel (characters, backdrops). Source: `gamesvmg.wmupd.com`
- **News thumbnail images** — small previews in the news ticker. Source: `gamesvmg.wmupd.com`
- **Game catalog icons** in the carousel (异环, 诛仙世界, 新笑傲江湖 game-icon thumbnails). Sources: `gamesvmg.wmupd.com` + `img.games.wanmei.com`

To swap any of these, the mirror script needs extending to also pull from those CDNs. That's a Stage 2 task — say the word when you want to tackle it.

## Re-running

The rename script is idempotent. After re-running `mirror-wanmei-homepage.mjs` (which fetches fresh originals), just run `rename-mirror-images.mjs` again to re-apply the semantic names.
