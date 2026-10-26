# Changelog

Significant changes only, newest first. Keep entries short — a few lines and
the files that matter. Architectural reasoning belongs in `DECISIONS.md`.

## 2026-10-24 — Listings hardening (pre-rollout verification)

- **Database guard:** partial unique index `listings_one_active_per_type_idx`
  (`collections/hooks/listingIndexSchema.ts`), per-property advisory lock
  (`listingLock.ts`), readable REST error (`listingErrors.ts`).
- **One-save create:** create-only virtual "First listing (optional)" group on
  Properties (`collections/hooks/initialListing.ts`), transactional.
- **Fixes found in verification:** closed listing URL now 404 (was a cached 308 to
  the sibling sale), property-slug fallback is a 307; roll-up context flag no
  longer leaks across a shared request; virtual group was read-only in the admin;
  migration warning for rent-with-only-sale-price no longer also claims "price on
  request"; delete-guard message no longer suggests withdrawing helps; sidebar
  spacing.
- **Safety:** dev schema push disabled for non-local databases unless
  `RER_ALLOW_LIVE_SCHEMA_PUSH=true` (`lib/databaseSafety.ts`); migration APPLY
  needs `RER_CONFIRM_DATABASE_HOST`; `scripts/preview-schema-push.ts` can write the
  full SQL.
- **Rollout:** `docs/LISTINGS-ROLLOUT.md` rewritten (backup + restore check,
  reviewed SQL, verification SQL, order, rollback levels); new
  `docs/listings-schema.sql`, `listings-schema-undo.sql`,
  `listings-verify-baseline.sql`, `listings-verify-after.sql`.
- **Tests:** unit 93, real-PostgreSQL 29 (incl. direct-SQL duplicate rejection,
  concurrent creates, one-save create and rollback, permissions).

## 2026-10-23 — One property, many listings

**Added** the `listings` collection (admin › Listings): one sale, rental or lease
of a property, with its own ID (`RER-L-00001`), status, price and terms, URL, tags
and agent. A property can now be for sale and for rent at once without duplicating
its address, photos or owner. Properties are counted once; the console gained a
Listings group (live Sale / Rent / Lease).

- **Model:** `collections/Listings.ts`, `collections/hooks/{assignListingId,
  assignListingSlug,validateListing,syncPropertyRollup,protectPropertyWithListings,
  listingRelations}.ts`, `lib/listings/*` (vocabulary, rules, roll-up, slug, legacy
  planner, public selection, summaries). `Properties`: `purpose`/`pricing` now
  hidden legacy fields, `status` a read-only roll-up, new `isTenanted`, a Listings
  tab (`join`), listings sidebar block + list column. New sequence
  `rer_listing_id_seq`, declared in `idSequenceSchema.ts`.
- **Public site:** `lib/properties/*` now query listings (`mapProperty` ->
  `mapListing`, new `listingsWhere.ts`, `getPublicListings.ts`); one card per
  property with "Also for rent"; detail pages show "Also available"; a property's
  own slug 308-redirects to its leading listing; sitemap lists listings. Existing
  URLs unchanged (first listing keeps the property slug).
- **Admin console:** Listings group and recent listings; price check moved to
  listings; renewals and tenancy checks use `isTenanted`.
- **Migration:** `scripts/migrate-property-listings.ts` (dry run by default,
  `LISTING_MIGRATE_APPLY=1` to write). Expand-only and idempotent. The CSV importer
  and `seed-test-inventory.ts` create the implied listing.
- **Schema:** additive push (29 statements, `hasDataLoss: false`) — **not yet
  applied to the live database.** Production order and AppSheet notes:
  `docs/LISTINGS-ROLLOUT.md`.
- **Tests:** `tests/listings.test.ts` (77, no database) and
  `tests/listings.integration.test.ts` (20, real PostgreSQL, opt-in via
  `RER_LISTINGS_TEST_DATABASE_URL`). `npm test` runs the first.
- `payload-types.ts` and `app/(payload)/admin/importMap.js` regenerated.

## 2026-10-21 — Website Banners managed in Payload

**Added** the `website-banners` collection (admin › Website) and moved every
page banner onto it: homepage hero, homepage Our Story image, `/properties`
(plus rent/lease and commercial filter variants), `/projects`, `/about`,
`/contact`. Nothing visible changes until a banner is published.

- `collections/WebsiteBanners.ts`, `collections/hooks/revalidateWebsiteBanner.ts`
  (new); registered in `payload.config.ts`; `payload-types.ts` regenerated.
  Schema pushed by `next dev` after a verified additive dry run.
- `lib/website-banners/` (new) data layer; `components/ui/PageBanner.jsx`
  (single `banner` prop, overlay/alignment/CTA), `home/Hero`,
  `home/AboutTeaser`, and the five route files now fetch banners.
  `<h1>` text gains the missing space before its gold line; About's header
  matches the other pages.
- `scripts/seed-website-banners.ts` (new; run once — 8 drafts created);
  `scripts/prepare-banner.mjs` now exports to gitignored `banner-exports/`.
- `tests/website-banners.test.ts` (new, 48 tests). Removed the interim
  `lib/banners.ts` registry and its test.
- `docs/BANNER-ASSETS.md` is now the admin guide plus photography brief.

## 2026-10-19 — Fix: Create Draft Project failed on `rer_project_id_seq`

**Fixed** `Failed query: SELECT nextval('rer_project_id_seq')`. Root cause: the
dev schema push (`next dev`, every boot and every HMR schema reload) dropped
`rer_project_id_seq` and `rer_property_id_seq` as unknown to the Drizzle
schema; `onInit` does not re-run on HMR, so they stayed missing. Both were
absent from the live DB; the next app boot recreated them (project = 7,
property = 22, in sync with stored IDs).

- `collections/hooks/idSequenceSchema.ts` (new) declares both sequences to
  Drizzle via `afterSchemaInit` in `payload.config.ts` so the push keeps them.
- `collections/hooks/allocateIdSequence.ts` (new) is the shared `nextval`
  allocator for both hooks; on "relation does not exist" it runs the idempotent
  `ensure*IdSequence` once and retries.
- `tests/id-sequences.test.ts` + `npm test` (node:test via tsx, no new deps).
  The real-DB suite runs only with `RER_TEST_DATABASE_URL`, inside a rolled-back
  transaction.
- ID formats, JSON import, amenity matching unchanged. No migration file.

## 2026-10-19 — Agreement Term (Days)

**Added**

- `rentHistory[].agreementTermDays` (optional, whole number ≥ 0) shown beside
  Agreement Term (Months) at 50% width each; `agreementTermMonths` now also
  validates as a whole number ≥ 0.
- `calculateAgreementEndDate()` accepts `termDays`; wired into the row's
  `agreementEndDate` hook, `currentAgreementEndDate` hook and the backfill
  script. Row label shows days. `payload-types.ts` updated by hand.
- New Postgres column `agreement_term_days`: no migrations folder exists, so
  it is created by Payload's schema push when the dev server next starts.

**Files:** `lib/properties/agreementDates.ts`, `collections/Properties.ts`,
`components/payload/RentHistoryRowLabel.tsx`,
`scripts/backfill-current-agreement-end-date.ts`, `payload-types.ts`.

## 2026-09-26 — Laptop-migration audit, setup guide and backup bundle

**Added**

- **`docs/NEW-LAPTOP-SETUP.md`** — prerequisites, the full environment-variable
  table, validation checklist and a before/after migration checklist. Records
  that the database and media are remote, so neither needs restoring.
- **`.gitignore`** — now ignores `graphify-out/` (4 MB of derived graph),
  `.claude/scheduled_tasks.lock`, and dump/snapshot/backup patterns so a
  database export can never be committed.

**Fixed**

- **`.env`** was missing `NEXT_PUBLIC_SITE_URL`, so `npm run build` failed at
  `payload.config.ts:51`. Added locally (the file is gitignored);
  `.env.example` already documented it.

**Verified**

- Sequences in sync: `rer_property_id_seq` = 22 / `RER-00022`,
  `rer_project_id_seq` = 7 / `RER-P-0007`. No duplicate-ID risk.
- All 38 media records have their physical file among the bucket's 120 objects.
- `tsc --noEmit`, `npm run lint` and `npm run build` all pass.

**Open security item**

- A live `GOOGLE_MAPS_API_KEY` is readable in commit `0a24536` (`.env` and
  `server/.env`, deleted in `a1b116c`) and this repository is public. The
  database password, `PAYLOAD_SECRET` and the `S3_*` keys were never committed.
  Rotation is pending in Google Cloud Console — see `NEW-LAPTOP-SETUP.md`.

## 2026-09-24 — "Slug Update" button on the property slug field

**Added**

- **`components/payload/RegenerateSlugButton.tsx`** — a **Slug Update** button
  beside the Properties `slug` field. It rebuilds the slug from the form's
  current BHK, property type, locality and RER ID using the same
  `buildPropertySlug()` the create hook uses, writes to form state only, and
  stays disabled until the property has a `propertyId`.
  Registered as the field's `admin.components.afterInput`.
- **`app/(payload)/custom.scss` §12** — lays the slug input and the button out as
  a two-column grid (stacked below 880px). The field carries
  `admin.className: 'rer-slug-field'` for that rule to hook onto.

**Why**

Slugs are generated on create only, so a duplicated property inherits the source
listing's descriptive tokens (it does get a fresh RER ID), and a locality/BHK
correction made after creation leaves the slug quoting the old value. The only
previous fix was retyping the slug by hand. See `DECISIONS.md` — "The one escape
hatch is a button, not a hook".

No schema change, no new dependency, no change to how slugs are generated on
create and none to any existing public URL.

## 2026-09-23 — Site quality pass: favicon, HSTS, contrast, spam, analytics hook

A quality/security/accessibility pass over the public site. No schema change,
no new dependency, no change to property/project data, media storage, the
admin console or the public URL structure.

**Added**

- **Favicon and icons.** There were none at all — `/favicon.ico` 404'd.
  `app/icon.png` (48px) and `app/apple-icon.png` (180px), plus
  `public/icon-192.png` / `icon-512.png` for `app/manifest.ts`. All generated
  with sharp from `public/logo-HOUSE-white.svg` on the brand navy.
- **Default social image.** `public/og-default.png` (1200x630, brand lockup on
  navy), exported as `DEFAULT_OG_IMAGE` from `lib/seo/ogImage.ts` and wired
  into the layout, `/about`, `/contact`, both listing pages, and as the
  fallback on property/project detail pages that have no photograph. Only `/`
  and the two legal pages previously had any OG image.
- **Security headers** in `next.config.mjs`: HSTS (production only),
  `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`,
  and `poweredByHeader: false`. No HTTP->HTTPS redirect — Railway already does
  that at its edge.
- **Rate limiting** on `POST /api/contact`: `lib/rateLimit.ts`, 5 requests per
  10 minutes per IP, answering 429 with `Retry-After`. The honeypot and timing
  checks only inspect one request's shape; a bot that omits `renderedAt`
  passed both.
- **Optional analytics.** `components/Analytics.jsx` renders nothing unless
  `NEXT_PUBLIC_ANALYTICS_SRC` and `NEXT_PUBLIC_ANALYTICS_DOMAIN` are set. No
  provider chosen, no values committed. Documented in `.env.example`.
- **Branded 404 for unmatched URLs.** `app/(website)/[...notFound]/page.jsx`.
  With two root layouts Next could not pick one for a globally-unmatched URL
  and served its own bare "404 | This page could not be found" — only URLs
  that reached a real route and called `notFound()` got the RER page. Status
  was always correct; the page was not.

**Changed**

- **Cormorant Garamond is now self-hosted** via `next/font` in the website
  layout, and `--font-cormorant` is defined in `src/index.css`'s `@theme`.
  The face was being downloaded from Google via a render-blocking `@import`
  and then never applied, because the `font-cormorant` utility had no matching
  theme key — both wordmarks rendered in the default sans. Weight 600 only.
- **Gold text on light backgrounds** now uses `--color-rer-gold-text`
  (`#8a6728`); `--color-rer-gold` (`#b8862f`) is unchanged and still correct
  on the navy, as a fill, a rule and an icon. Measured 3.24:1 on white and
  2.97:1 on sand against a 4.5:1 requirement.
- **White-on-gold badges and chips are now navy-on-gold**, matching what every
  gold CTA on the site already did. White on `#b8862f` measured 3.24:1.
- **FeaturedShowcase tabs** sized for 320px, not 375px — the two
  `whitespace-nowrap` labels were 28px wider than the content box and put a
  horizontal scrollbar on every page at that width.
- `.env.example` documents the five required `S3_*` variables, which it
  previously omitted entirely.


## 2026-09-18 — `area`/`areaUnit` replaced by Carpet Area / Built-up Area

Properties' single general `details.area`/`areaUnit` pair is gone, replaced
by dedicated `details.carpetArea`/`carpetAreaUnit` and `details.builtUpArea`/
`builtUpAreaUnit` (both unit selects default to `sq-ft`). Closes the gap
`scripts/import-properties.ts` already flagged: Payload previously had
nowhere to put both a CSV row's Carpet Area and Built-up Area figures.

All 19 existing properties' `area` values were migrated into `carpetArea`
first (dry-run verified, then applied, then diffed against a before/after
snapshot confirming every sibling field was untouched) before `area`/
`areaUnit` were removed from the schema — dropping the Postgres columns
required accepting `@payloadcms/drizzle`'s interactive data-loss prompt (see
`DECISIONS.md`).

Updated to match: `lib/properties/mapProperty.ts` / `formatLocation.ts`
(`areaDisplay` now prefers `carpetArea`, falls back to `builtUpArea`),
`lib/admin-console/checks.ts`'s "no area recorded" check, and
`scripts/import-properties.ts` (writes both CSV columns to their own field
now, no more "both populated → error"). `scripts/seed-test-inventory.ts`'s
five Property test records renamed `area`/`areaUnit` → `carpetArea`/
`carpetAreaUnit` with the same values — Projects' own separate
`configurations[].carpetArea` was not touched. `payload-types.ts`
regenerated. See `DECISIONS.md` for the full account.

## 2026-09-18 — RER Property Management Console replaces the admin dashboard

`/admin` now opens on an operational console: status counts for Properties
and Projects, quick actions, Needs Attention, Agreement Renewals, recently
updated records, and a collection index. Registered as
`admin.components.views.dashboard` in `payload.config.ts`, which replaces
only the dashboard body — the nav rail, account menu, every collection route
and `/admin/brochure-convert` are untouched. No schema change, no new
dependency, nothing on the public website changed.

New `lib/admin-console/` (URL/`Where` serialization, schema-derived status
options, the data-quality checklist, the loader), new
`components/payload/dashboard/` (server components, no client JS of their
own), new `app/(payload)/custom.scss` §11. Status tiering moved to
`lib/statusTiers.ts` and countdown badge styling into
`lib/properties/agreementCountdown.ts`, both now shared with the list-view
Cells. `components/payload/AdminDashboardSummary.tsx` and its
`afterDashboard` registration removed — superseded.

Every figure is a live `payload.count()` over the same `Where` its link
navigates to, and checks cover only fields Payload lets staff leave empty.
See `DECISIONS.md`.

## 2026-09-17 — Denser Properties/Projects list tables + synchronized scroll

Fixed the excessive column width on both list tables: `app/(payload)/
custom.scss` §8 now caps `th`/`td` width (Payload's own default has no
max-width), lets long nested-field headers wrap onto two lines instead of
forcing the column to fit one line, sizes columns by field-name tier
(id/date/status/price/text) with matching left/center/right alignment, and
adds a subtle grid of hairline borders. New
`components/payload/TableScrollSync.tsx`, registered via
`admin.components.beforeListTable` on both `collections/Properties.ts` and
`collections/Projects.ts`, adds a synchronized horizontal scrollbar above the
table that drives the same underlying scroll position as the native one
below it. See `DECISIONS.md` for the root cause and why the list-table header
stays non-sticky.

## 2026-09-17 — Agreement countdown also shown in the sidebar

Added a sidebar display (right under Status) of the same
`currentAgreementEndDate` countdown already shown in the property list —
`agreementCountdown`, a `type: 'ui'` field (no second data column) whose
`AgreementCountdownSidebar` component reads the live form's `status` and
`currentAgreementEndDate` and renders only for `rented` properties. Extracted
the shared day-math/urgency logic into `lib/properties/agreementCountdown.ts`
so the list Cell and the sidebar display can't disagree on it.

## 2026-09-17 — Owner-relationship fields; denormalized currentAgreementEndDate

Added `ownerBasedIn`, `withRerSince` (validated 4-digit year), `openToSelling`
(default `not-discussed`) and `renewalCalledOn` to the existing `ownerDetails`
group — inherits its group-level `access.read: Boolean(user)` gate, no new
access code needed.

Added `currentAgreementEndDate`: a denormalized, read-only, top-level `date`
field in the Rent Details tab, kept in sync by its own `beforeChange` hook
from the last `rentHistory` entry (recomputed via `calculateAgreementEndDate`
directly from that entry's start date + term, not read from the entry's own
computed value, so correctness doesn't depend on field-hook execution order).
Added to `admin.defaultColumns` and rendered there via the new
`components/payload/AgreementCountdownCell.tsx` ("N days left" / "Expired Nd
ago", coloured by urgency at the 60-day mark). Explicitly gated
`access.read: Boolean(user)` — a top-level field doesn't inherit
`rentHistory`'s own gate.

`scripts/backfill-current-agreement-end-date.ts` (dry-run by default) applied
to all 18 existing properties — a hook-computed field isn't backfilled by
Postgres's own schema push the way a field with a static `defaultValue` is
(confirmed directly: `openToSelling`'s default WAS retroactively present in
the raw Postgres row for existing properties, correcting an earlier claim
that it wouldn't be).

Verified via the Local API: privacy (public/unauthenticated reads return
nothing for these non-public "rented" records; authenticated reads see the
real value) and sort order (the two properties whose agreements end 30 Sep
2026 sort to the top).

## 2026-09-17 — First property CSV import applied; Owner Details extended; Agreement End Date fixed

Applied `scripts/import-properties.ts` for real: 18 properties created
(`RER-00001`–`RER-00018`, via the script's `IMPORT_PROPERTY_ID_START` override
— the CSV's own column said `RER-00008`–`RER-00025`), each with its tenancy
recorded in `rentHistory`. Sequence now correctly hands out `RER-00019` next.
Verified: no duplicate IDs or slugs, no unrelated collection touched.

Added `ownerDetails` (Owner Details tab: `ownerName`, `ownerContact`),
`details.parking` and `pricing.parkingCharges` to `collections/Properties.ts`,
driven by real unmapped columns in the first CSV — see `DECISIONS.md` for why
these three and not the rest.

Fixed `calculateAgreementEndDate()` (`lib/properties/agreementDates.ts`): now
returns the last calendar day of the term (Start + Term − 1 day), not the day
the next term would begin. Every CSV row's previously-reported one-day
"discrepancy" was this bug, not bad source data.

Also fixed a sequence-priming edge case discovered while applying: priming
for the very first record (target `RER-00001`) previously computed
`setval(seq, 0, ...)`, which Postgres rejects (`MINVALUE 1`). Switched to
`setval(seq, target, false)`, which has no such boundary case.

## 2026-09-16 — Property CSV import script

Added `scripts/import-properties.ts` (`npm run import:properties -- "<csv>"`),
a dry-run-by-default, idempotent bulk import for the `properties` collection
covering the new `rentHistory` array. Matches existing records on the CSV's
exact `Property ID`; never overwrites a populated field with a blank CSV
value; never deletes. See the CSV → Payload mapping table in
`docs/CLAUDE/DATA-MODEL.md` and the Property ID sequence-priming approach in
`docs/CLAUDE/DECISIONS.md`. No collection schema or hook logic changed.

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
