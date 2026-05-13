# `/data/` — Static content for the Next.js app

JSON files extracted from upstream wanmei JS globals. Hand-edit to update content; rebuild and redeploy.

## Files

| File | Source (legacy) | Used by component |
|------|-----------------|-------------------|
| `heroSlides.json` | `games_data_data.AD3` / `AD4` (`games-gameSwiper.js`) | `<HeroCarousel>` |
| `brands.json` | `<li class="brand1..4">` from old `index.html` | `<BrandBusiness>` |
| `news.json` | `games_data_data.AD1` / `AD5` (NOT YET extracted — Phase 5) | `<NewsSection>` |
| `games.json` | `gameCenterData` (`pc_gamecenter2104.js`) (NOT YET extracted — Phase 7) | `<HotGames>` |
| `community.json` | `<ul class="offical_list">` from old `index.html` | `<OfficialCommunity>` |
| `nav.json` | `.top_nav_ul`, `.helps_slide`, `.check-lang` from old `index.html` | `<Header>` |

## TODO (extracted in later phases)

- [ ] `news.json` — extract from games-gameSwiper.js AD1 + AD5
- [ ] `games.json` — extract from pc_gamecenter2104.js gameCenterData
- [ ] Add `tags` array to each game (genre, platform, etc.)
- [ ] Provide bilingual `title_zh` / `title_vi` for VN rebrand
