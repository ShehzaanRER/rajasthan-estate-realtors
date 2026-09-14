# Changelog

Significant changes only, newest first. Keep entries short — a few lines and
the files that matter. Architectural reasoning belongs in `DECISIONS.md`.

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
