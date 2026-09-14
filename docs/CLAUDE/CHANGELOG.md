# Changelog

Significant changes only, newest first. Keep entries short — a few lines and
the files that matter. Architectural reasoning belongs in `DECISIONS.md`.

## 2026-09-14 — Phase 1 technical SEO

Technical SEO foundation. No URL, content or design changes, and no existing
property slug was touched.

- **robots.txt** — the blanket `Disallow: /api` was also matching
  `/api/media/file/:filename`, i.e. every photograph on the site and every Open
  Graph image. Replaced with an enumerated disallow list that leaves
  `/api/media/file/` crawlable. `app/robots.ts` now has to be updated whenever a
  collection or endpoint is added; `payload.config.ts` is the source of truth.
- **Sitemap** — was built from `getProperties()`/`getProjects()`, which cap at
  100 records, so the 101st listing would have vanished from the sitemap and the
  listing page simultaneously. New `getSitemapEntries.ts` in each area paginates
  to completion at `depth: 0` over two columns — also far cheaper than the
  `depth: 2` + full-mapper query it replaces. Added `lastModified`; dropped
  `priority` and `changeFrequency`, which Google ignores.
- **Streamed metadata** — set `htmlLimitedBots` in `next.config.mjs`. Next 16
  streams the title, canonical and description after `</head>` for any user
  agent outside its built-in list; measured, they were landing ~51KB into the
  body. SEO crawlers and AI crawlers now get a blocking render. Googlebot and
  Bingbot were never affected.
- **JSON-LD** — property schema `Product` → `RealEstateListing`; every `url` is
  now absolute (they were relative, so both entities were unresolvable);
  `offers` is omitted entirely when the price is on request rather than emitting
  a currency with no price; project `addressLocality` now receives the locality
  instead of the city. Added `BreadcrumbList` to both detail routes, and `@id`
  plus `email` to the organisation.
- **Metadata** — detail titles are composed from structured fields in
  `lib/seo/titles.ts` (48–60 chars, down from 75–95 with the location stated
  three times). Added `summary_large_image`, absolute OG image URLs, and
  `canonical: null` on not-found pages, which were inheriting the homepage
  canonical.
- **Automatic property slugs** — new `assignPropertySlug` hook fills the slug on
  create only and is inert on every existing record. See `DECISIONS.md`.
- **Site URL guard** — `payload.config.ts` refuses to boot in production without
  `NEXT_PUBLIC_SITE_URL`, and warns when it is set to localhost.

## 2026-09-14 — Soft 404 on the detail routes

`/properties/<anything>` and `/projects/<anything>` answered **HTTP 200** for
nonexistent, draft, sold and rented listings — rendering the not-found UI with a
success status. Pre-existing, not a Phase 1 regression.

Root cause: **any `loading.jsx` above the page**. It creates a Suspense boundary,
so Next streams the shell and commits the 200 before the page body runs;
`notFound()` can then only swap the UI. Isolated with paired probe routes
identical except for that one file — without it 404, with it 200, at either the
`[slug]` segment or its parent. Route type, dynamic rendering, `not-found.jsx`,
the data layer and `generateMetadata` were each ruled out, and calling
`notFound()` inside `generateMetadata` does not help.

Fix: `/properties` and `/projects` moved into a `(listing)` route group with
their skeletons, and the two `[slug]/loading.jsx` files removed. URLs are
unchanged and the listing skeletons are byte-identical — the group exists only
to keep their Suspense boundary off the detail routes. Detail pages no longer
have a skeleton; that is the deliberate cost. See `DECISIONS.md`.

Verified: valid property 200, nonexistent 404, draft 404, legacy mixed-case slug
200, wrong-case 404, nonexistent project 404, both listings 200.

## 2026-09-14 — Property/project card image delivery and one card ratio

Card photographs were soft. The cause was not compression: every card was being
**over**-served. `sizes` was one shared literal across two grids whose real
widths differ by more than 2x, so the browser requested 1080–1920px files for
162–384px boxes and downscaled them itself in the compositor.

- Added `lib/cardImageSizes.ts` — `LISTING_CARD_SIZES` (the two-up
  `/properties` grid), `SHOWCASE_CARD_SIZES` (one-up sliders and the projects
  listing) and `showcaseCardSizes(count)` for the narrowed FeaturedShowcase
  tracks. `sizes` is now a required prop on both cards: the call site owns the
  grid, so it owns the promise. The old `CARD_IMAGE_SIZES` literal is gone from
  both card files.
- Card image boxes are `aspect-[3/2]` instead of fixed heights. A fixed height
  against a fluid width meant the box ranged from 1.04:1 to 2.28:1, so the same
  photograph was cropped differently on every screen. 3:2 is the dominant source
  aspect in the media library, so `object-cover` now discards almost nothing.
- `SimilarProperties`, `RelatedProjects`, `PropertiesListing` and
  `ProjectsListing` pass the appropriate constant; `FeaturedShowcase` uses
  `showcaseCardSizes(count)`, because narrowing the track below three cards
  makes each card *wider* and the `sizes` string has to follow the same count.
- Dropped `priority` from the FeaturedShowcase cards. It is the fourth section
  of the homepage, so preloading a card image only competed with the hero
  background — the actual LCP element, which already carries
  `fetchPriority="high"`.
- Rebuilt both listing skeletons to match what replaces them.
  `properties/loading.jsx` rendered one column of 300px-tall cards while the
  real listing renders two columns of 3:2 cards on mobile, so the swap moved
  every card on the page. Grid, container padding, image ratio and body padding
  now mirror the listing and card components.

See `DECISIONS.md` — "A card's `sizes` is owned by the grid it renders in" and
"Card images are 3:2, and that ratio is load-bearing" — for the measurements and
the maintenance rule.

## 2026-09-13 — Channel Partners populated as a developer inventory

The collection's purpose widened from "partners shown on the site" to RER's
internal developer inventory, with `active` as the publish switch.

- Seeded 16 developers via `scripts/seed-channel-partners.ts` (idempotent,
  matches on `name`, never deletes): 8 with Show on Website ticked, 8 held for
  internal reference.
- `logo` is no longer required — an internal-only developer may have no usable
  official logo. `active` is relabelled **Show on Website** in the admin; the
  field name is unchanged, so no migration.
- Uploaded 15 official logos (9 SVG, 3 PNG, 2 WebP, 1 extracted inline SVG),
  each taken from the developer's own website. Ashwin Sheth Group has none —
  only white-on-transparent variants are published.
- Verified: the 8 ticked developers render in Display Order, the other 8 do not
  appear; toggling Arkade Developers on and off added and removed it from the
  carousel with no code change.

## 2026-09-13 — Official Channel Partners

Added a CMS-driven partner logo strip directly below the legacy section
(`home/AboutTeaser`) on the homepage.

- Added the `channel-partners` Payload collection — `name`, `logo`,
  `websiteUrl`, `displayOrder`, `active` — registered in `payload.config.ts`
  (`collections/ChannelPartners.ts`).
- Added the public data layer `lib/channel-partners/` (`getChannelPartners`,
  `mapChannelPartner`, types, barrel), filtering on `active` and sorting by
  `displayOrder` then `name`.
- Added `components/home/OfficialChannelPartners.jsx` and
  `components/home/PartnerLogoCard.jsx`, wired into `app/(website)/page.jsx`.
- Logos, order and active state are managed entirely in the CMS; nothing about
  a partner is hardcoded.
- Added a responsive CSS marquee (`src/index.css`): duplicated sequence,
  `-50%` translate for a seamless loop, pause on hover and focus,
  `prefers-reduced-motion` fallback. No new dependency.
- Partners with a `websiteUrl` render as external links
  (`target="_blank"`, `rel="noopener noreferrer"`, accessible label); partners
  without one render as plain cards.
- Media verified through the existing pipeline: raster logos via
  `toDeliveryImage()` + `next/image` at `quality={88}`, SVG logos served
  unoptimized; aspect ratios preserved with `object-contain`.
- Verified against a dev server with temporary records (since removed): correct
  ordering, inactive partners hidden, seamless loop, no horizontal overflow at
  375 / 539 / 1280px, and `/`, `/properties`, `/projects`, `/about`, `/admin`
  all still 200.
- Lint and `tsc --noEmit` clean; `payload-types.ts` regenerated.
