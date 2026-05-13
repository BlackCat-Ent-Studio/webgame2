---
type: brainstorm-summary
date: 2026-05-13
topic: Hero info-card overlay — 1:1 upstream port (desktop + mobile) on modern stack
status: agreed, ready for plan
---

# Brainstorm — Hero Info Overlay 1:1 Port

## Problem
Localhost `:3000` hero is missing the info-card overlay that appears on each upstream hero slide. Visible on:
- Desktop upstream `games.wanmei.com` — right-side card: icon + title + viceTitle + divider + date line + red "查看详情 »" CTA
- Mobile upstream `games.wanmei.com/m/index.html` — bottom-right text block: title + viceTitle + CTA

Current `wanmei-next-app/components/hero-carousel.tsx` renders only the background `<img>` and a thumbnail strip.

## Requirements
- **Visual & content fidelity = 1:1 with upstream** at both breakpoints
- **Implementation = modern stack only**: Tailwind 4 utilities, React 19, TypeScript, no jQuery, no vendored legacy CSS
- **Responsive** (single-URL build; can't ship desktop-only)
- Preserve all upstream assets (`feedback_preserve_all_assets` memory)

## Upstream structure (verified from source)

### Desktop `AD3` → `.product_info1.product_info2`
```
.productCarousel_poster
├── <img>                                # bigpic 1920×1035
└── .product_info1.product_info2         # absolute, right side
    ├── .product_icon img (214px)        # viewpic
    ├── .product_p
    │   ├── <p>title</p>
    │   └── <span>viceTitle</span>
    ├── .product_line                    # divider rule
    ├── .product_s                       # mlink text (release / date)
    └── a.look_product_info_btn          # red CTA, bg-image sprite
                                         # href = slide.link
```

### Mobile `AD4` → `.product_info1.product_info8`
```
.productCarousel_poster
├── <img>                                # bigpic 750×1270 portrait
└── .product_info1.product_info8         # absolute right:56px top:830px
    ├── .product_p (text-align right)
    │   ├── <p>title</p>                 # 48px bold #fff
    │   └── <span>viceTitle</span>       # 42px #fff
    └── a.look_product_info_btn          # 145×45px sprite "更多"
                                         # href = slide.mlink (CTA target)
```

Mobile **drops** icon, divider, date-text. Same data shape as desktop but only `title`, `viceTitle`, CTA href surface.

## Approaches considered

### A. Single overlay block, responsive utilities (rejected)
Keep one DOM, hide/show inner pieces with `hidden md:block`. Position toggled via responsive Tailwind.
- Pro: less code, single source of truth.
- Con: structural differences (right-center vs bottom-right, text alignment, fields present) make conditional classes noisy; KISS violation; doesn't read 1:1 against either upstream.

### B. Two overlay blocks, breakpoint swap (recommended)
Two sibling overlays inside each `SwiperSlide`:
- `<div className="hidden md:flex …">` — desktop layout (full 6 elements)
- `<div className="flex md:hidden …">` — mobile layout (title + viceTitle + CTA)

- Pro: each block maps cleanly to one upstream layout; future tweaks scoped per breakpoint.
- Con: minor DOM duplication (~2 small blocks per slide; negligible).

### C. Slot-based subcomponents (rejected)
Extract `<HeroInfoDesktop>` and `<HeroInfoMobile>` files.
- Pro: separation of concerns.
- Con: YAGNI for only 2 slides × 2 layouts; over-abstracted for a single hero.

## Final approach: **B**

### Data changes (`data/heroSlides.json`)
Add one new field per entry: `mlink` (release/date Chinese string, desktop-only). Re-extract from live upstream AD3.

```jsonc
{
  "id": "yihuan",
  "title": "异环",
  "viceTitle": "超自然都市开放世界",
  "tagline": "一切正常，就是异常！",
  "mlink": "<extract from upstream AD3>",       // NEW
  "thumb": "...icon-200x200.png",
  "imageDesktop": "...1920x1035.jpg",
  "imageMobile": "...750x1270.jpg",
  "link": "https://yh.wanmei.com/"
}
```

### Component changes (`components/hero-carousel.tsx`)

1. Drop the outer `<a href={slide.link}>` wrapper around `<picture>` (upstream doesn't link the bigpic; CTA is the only link → better a11y).
2. Inside each `SwiperSlide`, wrap `<picture>` in a `relative` container and add two overlay siblings:

```tsx
<SwiperSlide key={slide.id}>
  <div className="relative w-full">
    <picture>
      <source media="(max-width: 767px)" srcSet={slide.imageMobile} />
      <img src={slide.imageDesktop} alt={slide.title} className="w-full h-auto block object-cover" />
    </picture>

    {/* Desktop overlay — 1:1 AD3 product_info1.product_info2 */}
    <div className="hidden md:flex absolute right-[6vw] top-1/2 -translate-y-1/2 flex-col items-start gap-3 max-w-[420px] z-10">
      <img src={slide.thumb} alt="" className="w-20 lg:w-[110px] aspect-square rounded-md" />
      <div>
        <p className="text-3xl lg:text-5xl font-bold text-white">{slide.title}</p>
        <span className="block text-lg lg:text-2xl text-white/90">{slide.viceTitle}</span>
      </div>
      <div className="h-px w-24 bg-[var(--color-accent-gold)]/60" />
      <p className="text-sm lg:text-base text-white/70">{slide.mlink}</p>
      <a
        href={slide.link}
        target="_blank"
        rel="noreferrer"
        className="inline-block px-6 py-2 rounded-full bg-[var(--color-accent-red)] hover:bg-[var(--color-accent-red-bright)] text-white text-sm lg:text-base font-medium transition"
      >
        查看详情 »
      </a>
    </div>

    {/* Mobile overlay — 1:1 AD4 product_info1.product_info8 */}
    <div className="flex md:hidden absolute right-4 bottom-[18%] flex-col items-end gap-2 max-w-[60%] z-10 text-right">
      <p className="text-2xl font-bold text-white drop-shadow-md">{slide.title}</p>
      <span className="text-base text-white/90 drop-shadow-md">{slide.viceTitle}</span>
      <a
        href={slide.link}
        target="_blank"
        rel="noreferrer"
        className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-accent-red)] text-white text-xs font-medium mt-1"
      >
        查看详情 »
      </a>
    </div>
  </div>
</SwiperSlide>
```

Positioning math (mobile): upstream uses `right:56px top:830px` in a 750×1270 frame (~4.4% right, ~65% top). `right-4 bottom-[18%]` approximates the same visual location above the thumb-strip overlay.

### CTA copy
Both breakpoints use plain text "查看详情 »" — not the sprite PNG. Reasons:
- Sprite is fixed-size raster, breaks responsive scaling
- Text scales with viewport, ready for Vietnamese swap in Phase 9 i18n
- Same red palette token (`--color-accent-red`) keeps visual parity

## Risks
1. **mlink Chinese copy drift** — upstream may rotate `mlink` strings (event-dependent). Mitigation: re-extract on each cutover; eventually pull dynamically if we add a CMS layer.
2. **Overlay obscures portrait artwork on mobile** — `bottom-[18%]` lands on a relatively empty bottom area of the 异环 + 幻塔 portraits, but verify visually after first render. Adjust with `bottom-[14%]` ~ `bottom-[22%]` if it clips characters.
3. **Two slides only** — Swiper "not enough slides for loop" warning persists (pre-existing). Out of scope here.
4. **CTA bg color contrast on light hero areas** — wanmei red on bright sky region of 幻塔 slide may need a subtle text shadow / button shadow. Drop-shadow added on mobile title; consider for desktop CTA if QA flags it.

## Success criteria
- Desktop ≥768px: overlay visible right side, all 6 elements present, hover state on CTA, links to slide.link in new tab.
- Mobile <768px: overlay visible bottom-right, 3 elements (title + viceTitle + CTA), text right-aligned.
- Resize between breakpoints triggers clean swap with no layout shift.
- Lighthouse a11y unaffected (single named link per slide, alt text on icon empty since title is adjacent).
- Hot reload picks up changes on save.

## Next steps
1. Re-extract `mlink` strings from `games.wanmei.com` AD3 → patch `heroSlides.json`.
2. Edit `components/hero-carousel.tsx` per the snippet above.
3. Visual QA at 360px / 768px / 1280px / 1920px viewports.
4. Update `PROGRESS.md` (mark hero info-overlay done in Phase 4 notes).

## Open questions (none blocking)
- Should CTA "查看详情 »" be hard-coded Chinese or wrapped in a constant for future i18n? Defer to Phase 9; hardcode now.
- Does the user want hover lift / animation on CTA? Default to color-shift only; add scale if requested.
