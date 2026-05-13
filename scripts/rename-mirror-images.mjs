// Rename every mirrored image to a semantic, self-documenting name.
// In-place rename (keeps existing directory structure, just changes leaf
// filenames), then string-replaces every reference across HTML/CSS/JS.
// Idempotent: re-running after a re-mirror will rename again.
//
// Run: node scripts/rename-mirror-images.mjs

import { rename, readFile, writeFile, readdir, stat, access } from 'node:fs/promises';
import { join, dirname, posix } from 'node:path';

const MIRROR = 'mirror';

// Each entry: [oldRelativeUrlPath, newRelativeUrlPath, roleDescription]
// "URL path" = the path used inside HTML/CSS/JS, i.e. without the host prefix.
// We rename the leaf only; directory stays the same so references update via simple string replace.
const RENAMES = [
  // ── Logos / nav ────────────────────────────────────────────
  ['/images/common1711/logo.png',         '/images/common1711/nav-logo.png',           'Top nav: site logo (primary, used in header)'],
  ['/images/common1711/line.png',         '/images/common1711/chrome-divider-line.png','Generic horizontal divider (header strip)'],
  ['/images/index2103/logo.png',          '/images/index2103/nav-logo-footer.png',     'Footer logo'],
  ['/images/index2205/main/logo.png',     '/images/index2205/main/nav-logo-main.png',  'Top nav: main logo (refreshed 2022 brand)'],
  ['/images/index2103/nav_bg.png',        '/images/index2103/nav-bg.png',              'Top nav background strip'],
  ['/images/index2103/nav_active.png',    '/images/index2103/nav-active.png',          'Top nav active-state underline'],
  ['/images/index2103/iscountry.png',     '/images/index2103/nav-lang-flag.png',       'Language switcher CN/EN/KR flag/marker'],
  ['/images/index2103/line.png',          '/images/index2103/chrome-divider.png',      'Section divider line'],
  ['/images/index2103/slogan.png',        '/images/index2103/hero-slogan.png',         'Pre-rasterised hero slogan text'],
  ['/images/index2103/fbh_float.png',     '/images/index2103/chrome-float-banner.png', 'Floating right-side promo banner ("fbh")'],

  // ── Hero carousel ──────────────────────────────────────────
  ['/images/index2103/prev_btn.png',      '/images/index2103/hero-arrow-prev.png',     'Hero carousel: previous arrow button'],
  ['/images/index2103/next_btn.png',      '/images/index2103/hero-arrow-next.png',     'Hero carousel: next arrow button'],
  ['/images/index2103/bullet.png',        '/images/index2103/hero-bullet-off.png',     'Hero carousel: pagination bullet (inactive)'],
  ['/images/index2103/bullet_on.png',     '/images/index2103/hero-bullet-on.png',      'Hero carousel: pagination bullet (active)'],
  ['/images/index2103/kuang.png',         '/images/index2103/hero-frame.png',          'Hero carousel: image frame/border overlay'],
  ['/images/index2103/arrow_icon.png',    '/images/index2103/hero-arrow-icon.png',     'Hero info-card arrow icon'],
  ['/images/index2103/arrow_icon2.png',   '/images/index2103/hero-arrow-icon-alt.png', 'Hero info-card arrow icon (alt)'],
  ['/images/index2205/product_line.png',  '/images/index2205/hero-product-line.png',   'Hero info-card divider line'],
  ['/images/index2205/box1_gamg1/box1_game1_more_btn.png',
   '/images/index2205/box1_gamg1/hero-info-more-btn.png',                              'Hero info-card "more details" button'],

  // ── News section ───────────────────────────────────────────
  ['/images/index2103/title1.png',        '/images/index2103/section-title-news.png',  'Section title: 新闻动态 (News)'],
  ['/images/index2103/tab_bg.png',        '/images/index2103/news-tab-bg-off.png',     'News ticker tab background (inactive)'],
  ['/images/index2103/tab_bg_on.png',     '/images/index2103/news-tab-bg-on.png',      'News ticker tab background (active)'],
  ['/images/index2103/more_btn.png',      '/images/index2103/news-more-btn.png',       'News "more" button'],
  ['/images/index2103/more_btn_on.png',   '/images/index2103/news-more-btn-on.png',    'News "more" button (hover)'],

  // ── Brand grid ─────────────────────────────────────────────
  ['/images/index2103/title2.png',        '/images/index2103/section-title-brand.png', 'Section title: 品牌业务 (Brand)'],
  ['/images/index2103/brand_more.png',    '/images/index2103/brand-more.png',          'Brand grid "more" button'],
  ['/images/index2103/brand1.png',        '/images/index2103/brand-tile-01.png',       'Brand grid tile 1 (default state)'],
  ['/images/index2103/brand1_on.png',     '/images/index2103/brand-tile-01-hover.png', 'Brand grid tile 1 (hover state)'],
  ['/images/index2103/brand2.png',        '/images/index2103/brand-tile-02.png',       'Brand grid tile 2 (default)'],
  ['/images/index2103/brand2_on.png',     '/images/index2103/brand-tile-02-hover.png', 'Brand grid tile 2 (hover)'],
  ['/images/index2103/brand3.png',        '/images/index2103/brand-tile-03.png',       'Brand grid tile 3 (default)'],
  ['/images/index2103/brand3_on.png',     '/images/index2103/brand-tile-03-hover.png', 'Brand grid tile 3 (hover)'],
  ['/images/index2103/brand4.png',        '/images/index2103/brand-tile-04.png',       'Brand grid tile 4 (default)'],
  ['/images/index2103/brand4_on.png',     '/images/index2103/brand-tile-04-hover.png', 'Brand grid tile 4 (hover)'],
  ['/images/index2103/brand5.png',        '/images/index2103/brand-tile-05.png',       'Brand grid tile 5 (default, currently unused on page)'],
  ['/images/index2103/brand5_on.png',     '/images/index2103/brand-tile-05-hover.png', 'Brand grid tile 5 (hover)'],

  // ── Newgame block (commented in HTML, assets present) ──────
  ['/images/index2103/title3.png',        '/images/index2103/section-title-newgame.png','Section title: 新游推荐 (New Games)'],
  ['/images/index2103/title4.png',        '/images/index2103/section-title-04.png',    'Section title 4 (use TBD)'],
  ['/images/index2103/title5.png',        '/images/index2103/section-title-social.png','Section title: 官方社群 (Official Community)'],
  ['/images/index2103/change_btn.png',    '/images/index2103/newgame-change-btn.png',  'Newgame block: "change" button'],
  ['/images/index2103/features_right.png','/images/index2103/newgame-features-right.png','Newgame block: right panel decoration'],
  ['/images/index2103/newgame_mask.png',  '/images/index2103/newgame-mask.png',        'Newgame block: image mask overlay'],

  // ── Game catalog ───────────────────────────────────────────
  ['/images/index2103/game_list_bg.png',  '/images/index2103/gamelist-bg.png',         'Game catalog: drawer background'],
  ['/images/index2103/hot_bg.png',        '/images/index2103/gamelist-hot-badge.png',  'Game catalog: "hot" badge'],

  // ── Social strip ───────────────────────────────────────────
  ['/images/index2103/weibo_icon.png',    '/images/index2103/social-weibo.png',        'Social: Weibo icon'],
  ['/images/index2103/wx_iocn.png',       '/images/index2103/social-wechat.png',       'Social: WeChat icon (fixes "iocn" typo)'],
  ['/images/index2103/douliu_icon.png',   '/images/index2103/social-douliu.png',       'Social: Douliu (community) icon'],

  // ── Reservation popup (yy = 预约 / yuyue) ─────────────────
  ['/images/index2103/popbg.png',         '/images/index2103/popup-yy-bg-form.png',    'Reservation popup: form-state background'],
  ['/images/index2103/popbg_succ.png',    '/images/index2103/popup-yy-bg-success.png', 'Reservation popup: success-state background'],
  ['/images/index2103/popbg_end.png',     '/images/index2103/popup-yy-bg-end.png',     'Reservation popup: end/finished-state background'],
  ['/images/index2103/yy_btn.png',        '/images/index2103/popup-yy-submit-btn.png', 'Reservation popup: submit button (default)'],
  ['/images/index2103/yy_btn_on.png',     '/images/index2103/popup-yy-submit-btn-on.png','Reservation popup: submit button (hover)'],
  ['/images/index2103/yy_gametit.png',    '/images/index2103/popup-yy-game-title.png', 'Reservation popup: game title image'],
  ['/images/index2103/color_bar.png',     '/images/index2103/popup-yy-color-bar.png',  'Reservation popup: success colour-bar decoration'],
  ['/images/index2103/succ_yy_tit.png',   '/images/index2103/popup-yy-success-title.png','Reservation popup: success "thank you" title'],
  ['/images/index2103/suc_ok_btn.png',    '/images/index2103/popup-yy-success-ok-btn.png','Reservation popup: success OK button'],
  ['/images/index2103/douliu_info.png',   '/images/index2103/popup-yy-douliu-info.png','Reservation popup: Douliu QR/info block'],
  ['/images/index2103/close.png',         '/images/index2103/popup-close.png',         'Generic popup close (X) button'],
  ['/images/index2103/close.jpg',         '/images/index2103/popup-close-alt.jpg',     'Generic popup close (X) - JPG variant'],

  // ── Video popup ────────────────────────────────────────────
  ['/images/index2103/video_mask.png',    '/images/index2103/popup-video-mask.png',    'Video popup: dark overlay mask'],

  // ── Page background ────────────────────────────────────────
  ['/images/index2103/bg34.jpg',          '/images/index2103/chrome-page-bg.jpg',      'Page-wide background texture'],

  // ── Mobile-only (not visible on desktop homepage) ─────────
  ['/images/m/images/main/btn-play.png',  '/images/m/images/main/mobile-play-btn.png', 'Mobile-only: play button (unused on desktop)'],
];

// ─── core helpers ───────────────────────────────────────────────
async function exists(p) { try { await access(p); return true; } catch { return false; } }

function urlPathToLocalPath(urlPath) {
  // Both wanmei hosts mirror under games.wanmei.com (the only host using /images/...)
  return join(MIRROR, 'games.wanmei.com', ...urlPath.split('/').filter(Boolean));
}

async function walkTextFiles(root) {
  const out = [];
  async function rec(dir) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) await rec(p);
      else if (/\.(html?|css|m?js)$/i.test(e.name)) out.push(p);
    }
  }
  await rec(root);
  return out;
}

// ─── main ───────────────────────────────────────────────────────
async function main() {
  const renamed = [];
  const missing = [];
  const collisions = [];

  // 1. Rename files on disk
  for (const [oldUrl, newUrl, role] of RENAMES) {
    const fromLocal = urlPathToLocalPath(oldUrl);
    const toLocal = urlPathToLocalPath(newUrl);

    if (!(await exists(fromLocal))) {
      // either already renamed (idempotent re-run) or never mirrored
      if (await exists(toLocal)) {
        renamed.push({ oldUrl, newUrl, role, status: 'already-renamed' });
      } else {
        missing.push({ oldUrl, newUrl, role });
      }
      continue;
    }

    if (await exists(toLocal)) {
      collisions.push({ from: fromLocal, to: toLocal });
      continue;
    }

    await rename(fromLocal, toLocal);
    renamed.push({ oldUrl, newUrl, role, status: 'renamed' });
  }

  // 2. Update references inside HTML/CSS/JS.
  // Also rewrite absolute https URLs that point to renamed assets — needed for
  // the inline JS in index.html that sets `.top_logo` src to an absolute URL.
  // Without this, the browser fetches the renamed name from wanmei's live CDN
  // (which doesn't have the renamed file) and 404s with ERR_BLOCKED_BY_ORB.
  const textFiles = await walkTextFiles(MIRROR);
  let updates = 0;
  for (const f of textFiles) {
    let body = await readFile(f, 'utf8');
    let changed = false;
    for (const [oldUrl, newUrl] of RENAMES) {
      const oldAbs = 'https://games.wanmei.com' + oldUrl;
      const newRel = './games.wanmei.com' + newUrl; // browser-relative from /index.html
      if (body.includes(oldUrl)) {
        body = body.split(oldUrl).join(newUrl);
        changed = true;
        updates++;
      }
      if (body.includes(oldAbs)) {
        // Patch any remaining absolute occurrences (post the leaf-rename pass)
        body = body.split(oldAbs).join(newRel);
        changed = true;
        updates++;
      }
    }
    if (changed) await writeFile(f, body);
  }

  // 3. Generate manifest
  const manifestRows = renamed
    .filter((r) => r.status !== 'already-renamed' || true)
    .map((r) => `| \`${r.newUrl.split('/').pop()}\` | ${r.role} | \`${r.newUrl}\` | (was \`${r.oldUrl.split('/').pop()}\`) |`)
    .join('\n');

  const manifest = `# Wanmei Mirror — Image Manifest

Generated by \`scripts/rename-mirror-images.mjs\`. Captured **${new Date().toISOString().slice(0, 10)}**.

Every image visible on the homepage mirror, with semantic name + role.
**To swap an image:** drop a replacement file with the **same filename** at the same path. The HTML/CSS/JS references are already wired to the new names.

## Sections

Filenames follow the pattern \`<section>-<role>[-<index>][-<state>].<ext>\`. Sections used:

| Prefix | Section |
|---|---|
| \`nav-\` | Top navigation bar (logo, language switcher, active strip) |
| \`hero-\` | Main fade carousel (slides, thumbnails, arrows, info card) |
| \`news-\` | Vertical news ticker + image preview tabs |
| \`brand-\` | 4 promo brand tiles |
| \`gamelist-\` | Mega-menu drawer game catalog |
| \`section-title-\` | Pre-rasterised section heading text |
| \`social-\` | Bottom social-media icons (Weibo / WeChat / Douliu) |
| \`popup-yy-\` | Reservation popup (yy = 预约 / yuyue) — form, success, end states |
| \`popup-video-\` | Video popup mask |
| \`popup-close\` | Generic close button |
| \`chrome-\` | Generic page chrome (dividers, page bg, floating banner) |
| \`newgame-\` | Newgame recommendation block (assets exist, HTML block currently commented out) |
| \`mobile-\` | Mobile-only assets (not visible on desktop) |

## Manifest Table

| Filename | Role | Path | Original |
|---|---|---|---|
${manifestRows}

## How to swap an image

1. Pick a target by **role** ("Brand grid tile 2 hover state") or **filename** ("\`brand-tile-02-hover.png\`")
2. Tell Claude: *"Replace brand-tile-02.png with my new file at C:/foo/bar.png"* (or attach it)
3. Claude will copy your file to \`mirror/games.wanmei.com/images/index2103/brand-tile-02.png\` (overwriting)
4. No HTML/CSS/JS edits needed — paths are already wired to the new names

## Re-running

This script is idempotent. Files already renamed get a \`already-renamed\` status. Re-running after \`mirror-wanmei-homepage.mjs\` re-fetches the originals will re-apply renames cleanly.

## Hotlinked content (NOT in manifest)

Hero campaign art and news thumbnails come from \`gamesvmg.wmupd.com\` and \`img.games.wanmei.com\` — they hotlink at runtime and **are not in the local mirror**. To swap those, the mirror script needs extending to include those CDNs (Stage 2 work, see brainstorm reports).

## Summary

- **Renamed:** ${renamed.filter(r=>r.status==='renamed').length}
- **Already renamed (idempotent skip):** ${renamed.filter(r=>r.status==='already-renamed').length}
- **Missing (never mirrored):** ${missing.length}
- **Collisions (target exists, skipped):** ${collisions.length}
- **Reference updates across HTML/CSS/JS:** ${updates}
`;

  await writeFile('docs/wanmei-mirror-image-manifest.md', manifest);

  console.log('=== Rename Summary ===');
  console.log('Renamed:', renamed.filter(r=>r.status==='renamed').length);
  console.log('Already renamed:', renamed.filter(r=>r.status==='already-renamed').length);
  console.log('Missing:', missing.length, missing.length ? '— see below' : '');
  missing.forEach((m) => console.log(' -', m.oldUrl, '→', m.newUrl));
  console.log('Collisions:', collisions.length);
  collisions.forEach((c) => console.log(' -', c.from, '→', c.to));
  console.log('Reference updates:', updates);
  console.log('Manifest:', 'docs/wanmei-mirror-image-manifest.md');
}

main().catch((e) => { console.error(e); process.exit(1); });
