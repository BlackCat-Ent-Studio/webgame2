# Wanmei Mirror — Data Schemas

TypeScript-style interfaces inferred from the mirrored JS data files.
Captured 2026-05-07.

## `games_data_data` (from `games-gameSwiper.js`)

Single global declared via `var games_data_data = { ... }`. Contains 5 ad slots, only AD1 + AD3 used by homepage.

```typescript
interface GamesDataData {
  AD1: AdItem[]; // News ticker (vertical Swiper, 4 visible at a time)
  AD2: AdItem[]; // (loaded but unused on homepage)
  AD3: AdItem[]; // Hero carousel (fade Swiper + thumb strip)
  AD4: AdItem[]; // (unused)
  AD5: AdItem[]; // (unused)
}

interface AdItem {
  title: string;       // headline (e.g. "异环")
  viceTitle: string;   // subtitle (e.g. "超自然都市开放世界")
  bigpic: string;      // hero/news big image URL — points to gamesvmg.wmupd.com CDN
  viewpic: string;     // thumbnail/icon URL
  link: string;        // outbound URL on click (game site)
  mlink?: string;      // (AD3 only) marketing tagline OR mobile link
}
```

### Counts at capture time
- AD1: 10 items (news)
- AD2: 11 items
- AD3: 14 items (hero)

### Sample
```json
// AD1[0] — news
{
  "title": "《异环》全平台公测现已开启！",
  "viceTitle": "鉴定师，欢迎来到海特洛！",
  "bigpic": "https://gamesvmg.wmupd.com/rms/common/yh260423-770x441.jpg",
  "viewpic": "https://gamesvmg.wmupd.com/rms/common/yh26020444-icon-200x200.png",
  "link": "https://yh.wanmei.com/news/gamenews/20251222/259966.html"
}

// AD3[0] — hero
{
  "title": "异环",
  "viceTitle": "超自然都市开放世界",
  "bigpic": "https://gamesvmg.wmupd.com/rms/common/yh260423-1920x1035.jpg",
  "viewpic": "https://gamesvmg.wmupd.com/rms/common/yh260204-icon-PC214X102.png",
  "link": "https://yh.wanmei.com/",
  "mlink": "一切正常，就是异常！"
}
```

## `publicloadGameData` (from `loadGameData.js`)

Game catalog for the mega-menu drawer + 4-column game grid.

```typescript
interface PublicLoadGameData {
  client: GameItem[];   // 客户端游戏 (PC client games)
  mobiel: GameItem[];   // 手机游戏 (typo in source: "mobiel" not "mobile")
  webgame: GameItem[];  // 网页游戏
  other: GameItem[];    // 游戏平台 (platform/launcher)
  cate: unknown;        // (unused on homepage)
}

interface GameItem {
  name: string;   // display name (e.g. "诛仙世界")
  url: string;    // outbound link
  new: boolean;   // shows "new" badge
  hot: boolean;   // shows "hot" badge
}
```

### Counts at capture time
- client: 16
- mobiel: 25 (note typo)
- webgame: 1
- other: 3

### Sample
```json
{
  "name": "诛仙世界",
  "new": false,
  "hot": false,
  "url": "https://zxsj.wanmei.com/"
}
```

## `gameCenterData` (from `mirror/games.wanmei.com/pc_gamecenter2104.js`)

Powers two homepage sections:
- **新游推荐** — `.features-top` + `.features-thumbs` (Swiper). Reads `newGame.{host, pc, mobile}` and filters by `newsort[]` allowlist hardcoded inline in `index.html` (around line 736).
- **热门游戏** — `.hot_games_list` flat grid. Flattens ALL `gameCenterData` entries (newGame + hotGame, every subkey) and filters by `isView === true`.

```typescript
interface GameCenterData {
  newGame: {
    host: NewGameItem[];     // 主机 (console)
    pc: NewGameItem[];       // 端游 (PC client)
    mobile: NewGameItem[];   // 手游
  };
  hotGame: {
    mobile: HotGameItem[];   // 手游
    pc: HotGameItem[];       // 端游
    danji: HotGameItem[];    // 单机 (single-player)
    host: HotGameItem[];     // 主机
    yeyou: HotGameItem[];    // 页游 (web games)
  };
}

interface NewGameItem {
  id: string;
  name: string;             // matched against `newsort[]` allowlist
  icon: string;             // 200x200 logo
  faceUrl: string;          // 818x468 banner
  desc: string;             // short type/genre line
  src: (string | [string, string])[];  // carousel media; tuples are [video, poster]
  intro: string;            // HTML blob
}

interface HotGameItem extends NewGameItem {
  linkUrl: string;          // outbound site URL
  isView: boolean;          // gates inclusion in 热门游戏 grid
}
```

### Counts at capture time (pre-trim, 2026-05-08)
- `newGame.host`: 1, `newGame.pc`: 1, `newGame.mobile`: 2
- `hotGame.mobile`: ~17, plus pc/danji/host/yeyou buckets
- ~25+ entries had `isView: true`

### Sample (post-trim)
```json
{
  "id": "39",
  "name": "幻塔",
  "icon": "https://games.wanmei.com/images/index2103/gamecenter413/huanta_logo_pc_200x200.png",
  "faceUrl": "https://games.wanmei.com/images/index2103/gamecenter413/ht390_289.jpg",
  "desc": "轻科幻开放世界手游",
  "linkUrl": "https://ht.wanmei.com/",
  "isView": true,
  "src": ["..."],
  "intro": "<p>...</p>"
}
```

## Stage 2 Notes

- Treat schemas as **frozen at capture time**. Wanmei may evolve them; refetch + diff before relying on shape.
- The `mobiel` typo should be normalized to `mobile` if/when content is migrated to a Stage 2 JSON store.
- `mlink` overloading in AD3 (sometimes a tagline, sometimes a mobile link) needs clarification — check more samples or treat as opaque string.
- All image URLs use 3 different CDN hosts: `games.wanmei.com`, `static.games.wanmei.com`, `gamesvmg.wmupd.com`. Stage 2 should consolidate.
