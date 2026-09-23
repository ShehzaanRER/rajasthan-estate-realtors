/**
 * The `sizes` attribute for every property and project card on the site.
 *
 * Why this file exists
 * --------------------
 * Both card components previously shared one hardcoded literal —
 * `"(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"` — even though
 * the cards render in two materially different grids. `sizes` is a promise
 * about the *rendered CSS width*, and that promise was wrong everywhere:
 *
 *   /properties, 640px viewport, DPR2 — card renders at 268px, so it needs
 *   536 device pixels. The old string declared 100vw = 640 CSS px, which at
 *   DPR2 asks for 1280, and the smallest srcSet candidate at or above that is
 *   1920w. Thirteen times the pixel area the card can display.
 *
 * Nothing was ever under-served, so the cards were not starved of detail —
 * they were drowned in it, and browsers do not mipmap. A single-step
 * composite downscale of a 1920px image into a 384px box uses a cheap
 * bilinear filter and reads soft. Over-delivery was the blur.
 *
 * Correct sizing also lands cards on better variants. Measured retained
 * detail from the 4096px `large` source (the table in collections/Media.ts):
 *
 *     640    828   1080   1200   1920
 *     98%   104%    85%    86%    72%
 *
 * The old strings requested 1080/1200/1920. These request 640/828. Sharper
 * and smaller at the same `quality={82}`.
 *
 * Reading the clauses
 * -------------------
 * Each clause below is the card's real rendered width at that breakpoint,
 * computed from the grid and container classes at the call site, plus a few
 * points of headroom. Media conditions are evaluated in order — first match
 * wins — so they run widest-first.
 *
 * Above 1280px every grid is capped by `max-w-7xl`, so the card stops growing
 * and a fixed `384px` is exact. A `vw` unit there would keep inflating on
 * large monitors for a card that is not getting any bigger.
 *
 * Keeping this honest
 * -------------------
 * These strings encode the grid arithmetic, so they go stale silently if a
 * column count, container padding or `max-w-*` changes at a call site. When
 * you touch a card grid, re-derive the clause here, then verify in DevTools:
 * filter the Network panel to `_next/image` and check the `w=` parameter
 * against the card's real width at 390 / 768 / 1280 / 1920.
 *
 * A note on aspect ratio
 * ----------------------
 * Card image boxes are `aspect-[3/2]`, matching the dominant source aspect in
 * the library. That matters here: with `object-cover`, a source *wider* than
 * the box is constrained by height, not width, so `sizes` — which only
 * describes width — would need inflating to compensate. At 3:2 that
 * correction is zero for almost every image RER holds. Sources appreciably
 * wider than 3:2 (a 2.36:1 panorama, say) are a framing problem to fix in the
 * CMS, not a reason to inflate every request on the site by half.
 */

/**
 * `/properties` — the only grid that is **two-up on mobile**.
 *
 * Grid:      grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8
 * Container: max-w-7xl px-4 sm:px-10 md:px-16 lg:px-8
 *
 *   <640    (100vw - 32 - 16) / 2  ->  43.3vw @360 .. 44.4vw @430   -> 48vw
 *   640     (100vw - 80 - 24) / 2  ->  268px @640 .. 331px @767     -> 46vw
 *   768     (100vw - 128 - 24) / 2 ->  308px @768 .. 435px @1023    -> 45vw
 *   1024    (100vw - 64 - 64) / 3  ->  299px @1024 .. 384px @1279   -> 31vw
 *   1280    capped by max-w-7xl                                     -> 384px
 */
export const LISTING_CARD_SIZES =
  '(min-width: 1280px) 384px, (min-width: 1024px) 31vw, (min-width: 768px) 45vw, (min-width: 640px) 46vw, 48vw';

/**
 * Everything else: homepage Featured Properties / New Projects, Similar
 * properties, Related projects, and the `/projects` listing. All of these are
 * **one-up on mobile** — either a full-width slide in CardSlider or a single
 * grid column — then two-up at `md` and three-up at `lg`.
 *
 *   <768    100vw - 48 (px-6)      ->  87.7vw @390 .. 93.7vw @767    -> 94vw
 *   768     (100vw - 48 - 32) / 2  ->  344px @768 .. 471px @1023     -> 47vw
 *   1024    (100vw - 64 - 64) / 3  ->  299px @1024 .. 384px @1279    -> 31vw
 *   1280    capped by max-w-7xl                                      -> 384px
 *
 * The containers vary (`px-6` on the homepage, `px-6 sm:px-10 md:px-16`
 * elsewhere), so each clause takes the widest card any of them produces.
 */
export const SHOWCASE_CARD_SIZES =
  '(min-width: 1280px) 384px, (min-width: 1024px) 31vw, (min-width: 768px) 47vw, 94vw';

/**
 * FeaturedShowcase narrows its own track when it has fewer than three cards
 * (see `gridClassesFor` there), so a one- or two-card homepage renders cards
 * that are *wider* than the three-up case — the one place on the site where
 * the shared string would under-declare rather than over-declare.
 *
 *   1 card   md:max-w-xl md:grid-cols-1   -> track 576px, card 576px from md
 *   2 cards  md:grid-cols-2 lg:max-w-4xl  -> track 896px at lg, card 432px
 *   3+       the standard grid
 *
 * Below `md` the slider is one-up whatever the count, so the 94vw clause is
 * unchanged in all three cases.
 */
export function showcaseCardSizes(count: number): string {
  if (count === 1) {
    return '(min-width: 768px) 576px, 94vw';
  }

  if (count === 2) {
    return '(min-width: 1024px) 432px, (min-width: 768px) 47vw, 94vw';
  }

  return SHOWCASE_CARD_SIZES;
}
