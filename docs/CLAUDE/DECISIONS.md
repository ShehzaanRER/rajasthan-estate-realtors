# Architectural decisions

Decisions that shape how work is done in this repository. Each one is
supported by the current implementation; add new entries as decisions are
made, and update an entry if the code moves away from it.

## Payload is the source of truth for content

Property, project, amenity, partner and media content is entered in Payload and
drives the public website. The site reads it through the Payload **Local API**
(`lib/payload.ts`) inside server components — never by calling its own REST API
over HTTP. Nothing editable is hardcoded in React.

*Consequence:* new editable content means a collection or a field, not a
constant in a component.

## Properties and Projects stay separate

A Property is a single unit RER transacts on; a Project is a development with
configurations, towers and possession timelines. They have separate
collections, separate status vocabularies, separate `lib/` modules and separate
routes. The only things they share are the `amenities` master list, the `media`
collection and the media-folder hook.

*Consequence:* do not add a relationship between them, reuse one's mapper for
the other, or assume a feature built for one applies to the other. The rental
architecture and Channel Partners are Property/homepage concerns and do not
touch Projects.

## Public visibility is a query-layer rule, not a UI one

Whether a record reaches the public site is decided by status plus `where`
clauses in `lib/*/publicScope.ts`, applied with `overrideAccess: false`, and
backed by collection-level `read` access. It is never handled by omitting a
card in a component.

*Consequence:* the same rule automatically covers listings, detail routes,
feeds, related-items queries and the sitemap. Hiding something in the frontend
only would leave its slug, its API response and its sitemap entry live.

## Rental information belongs to the Property

`status: 'rented'` keeps the record in Payload and out of public inventory, and
the executed-agreement details live in a `rentDetails` group on the Property
itself, guarded by field-level read access and referenced by no public code.

There is deliberately **no separate rental-management system** — no tenancy
collection, no agreements collection, no relationships. Do not build one unless
it is explicitly requested.

## Channel Partners are a small dedicated collection

Partner logos are a five-field `channel-partners` collection (`name`, `logo`,
`websiteUrl`, `displayOrder`, `active`) rather than hardcoded frontend data,
so staff can add, reorder and retire partners without a code change.

It is deliberately not a partner CRM: no contacts, no agreements, no mapping to
projects. If richer partner data is ever needed, that is a new decision.

## One media delivery pipeline

Every CMS image goes through `toDeliveryImage()` (`lib/mediaUrl.ts`) and
`next/image`. The bounded `large` WebP derivative is the optimizer's input, not
the original upload, because feeding `next/image` a 48-megapixel camera file
cost a full download plus decode per generated width.

*Consequence:* do not introduce a second image system, a different optimizer,
or direct bucket URLs. Use the allow-listed `qualities` values only — Next 16
returns HTTP 400 for any other value.

Related: WebP only, no AVIF, because Next rescales the `quality` prop before
the AVIF encoder and the resulting quality ceiling visibly softened property
photography. And SVG uploads bypass the optimizer entirely (`unoptimized`),
since Payload produces no derivatives for them and rasterising a vector logo is
the one thing guaranteed to make it blurry.

## The partner carousel is CSS, not a dependency

The Official Channel Partners marquee is a CSS keyframe animation
(`src/index.css`) over a track that renders the partner sequence twice and
translates `-50%`, so the loop restart is invisible. The project had no
carousel or animation library, and a continuous logo ribbon did not justify
adding one. It needs no client JavaScript, so the section stays a server
component.

The existing `components/ui/CardSlider.jsx` was not reused: it is a discrete,
index-based, mobile-only slider with a "3 / 7" counter, which is a different
interaction from a continuous ribbon. For the same reason the marquee has no
arrows — hover and `:focus-within` pause it instead, and
`prefers-reduced-motion` turns it into a plain horizontal scroller.

## A card's `sizes` is owned by the grid it renders in

`PropertyCard` and `ProjectCard` both take `sizes` as a **required prop** from
`lib/cardImageSizes.ts`. Neither has a default, because the cards render in
grids whose real widths differ by more than 2x — two-up on mobile in
`/properties`, one-up in the homepage and Similar/Related sliders — and a
shared default was wrong in every one of them.

Getting this wrong does not starve the image; it floods it. A shared
`100vw`/`50vw`/`33vw` string made the browser request 1080–1920px files for
162–384px boxes, and a >2x single-step downscale in the compositor is bilinear,
so it reads *soft*. Over-delivery was the blur. Correct sizing also lands cards
on the 640/828 variants, which retain 98%/104% of source detail against the
1080/1200/1920 variants' 85%/86%/72% (the measurement table in
`collections/Media.ts`). Sharper and smaller at the same `quality={82}`.

*Consequence:* the strings encode grid arithmetic — column counts, container
padding, `max-w-*` caps — so they go stale silently when a card grid changes.
If you touch a grid, re-derive its clause in `lib/cardImageSizes.ts` and verify
in DevTools: filter Network to `_next/image` and check `w=` against the card's
real width. Above 1280px every grid is capped by `max-w-7xl`, so those clauses
are a fixed `384px` rather than a `vw` unit that would keep inflating for a card
that has stopped growing.

## Card images are 3:2, and that ratio is load-bearing

Both card types use `aspect-[3/2]`. Previously the image box had a fixed pixel
height against a fluid width, so its ratio ranged from 1.04:1 on a small phone
to 2.28:1 at 640px — the same photograph cropped differently on every screen.

3:2 is not arbitrary: it is the dominant source aspect in the media library, so
`object-cover` discards essentially nothing on most images. It also interacts
with `sizes`. With `object-cover`, a source **wider** than the box is
constrained by height, not width, so `sizes` — which only describes width —
would need inflating to compensate. At 3:2 that correction is zero for almost
everything RER holds; at 4:3 it would have been +12.5% on most of the library.

*Consequence:* do not change the card ratio without re-deriving
`lib/cardImageSizes.ts`. And a source appreciably wider than 3:2 (a 2.36:1
panorama, say) is a framing problem to fix in the CMS — not a reason to inflate
every image request on the site. Focal-point cropping is not an option here:
`collections/Media.ts` deliberately uses `fit: 'inside'` to avoid Payload's
focal-point resize path, which would upscale sub-bound originals.

## No Suspense boundary above a route that can 404

`/properties` and `/projects` live in a `(listing)` route group whose only
purpose is to keep their loading skeleton off the sibling `[slug]` routes. The
detail routes have no `loading.jsx` at all.

A `loading.jsx` makes Next stream the shell — and commit HTTP **200** — before
the page body runs. `notFound()` can then only swap the rendered UI, so every
nonexistent, draft, sold and rented listing URL answered 200 with "not found"
content: a soft 404.

Isolated with paired probe routes identical except for that one file: without it
404, with it 200, at either the `[slug]` segment or its parent. Route type
(static vs dynamic), the route group itself, `not-found.jsx`, the data layer and
`generateMetadata` were each independently ruled out. Calling `notFound()` inside
`generateMetadata` does **not** help — the shell has already flushed.

*Consequence:* do not add a `loading.jsx` at `properties/`, `projects/`, or under
either `[slug]/`. If a detail-page skeleton is wanted back, it has to come from a
`<Suspense>` *inside* the page around a child that is not on the 404 path — not
from a route-level `loading.jsx`. Verify any change with
`curl -o /dev/null -w '%{http_code}' /properties/does-not-exist`, which must
print 404.

## A published URL is a promise — property slugs are generated once and frozen

`collections/hooks/assignPropertySlug.ts` fills `slug` on **create only**, from
`[<bedrooms>-bhk-]<propertyType>-<locality>-<rer-id>` (see
`lib/properties/slug.ts`). Nothing regenerates it afterwards: editing the title,
locality, BHK, purpose or price leaves the slug alone, and the hook returns
untouched whenever `operation !== 'create'` or a slug already exists.

The RER ID carries the uniqueness. `propertyId` is already permanent,
non-editable and allocated atomically from the `rer_property_id_seq` sequence,
so the slug is unique *by construction* — no pre-flight existence query, and
therefore no race between two concurrent creates. The alternative, a purely
descriptive slug with `-2`/`-3` disambiguators, makes the one distinguishing
token an insertion-order accident, and RER genuinely does hold several
near-identical units in the same building and locality.

It also protects a future locality namespace: every generated slug ends in
`-rer-<digits>` and no locality slug ever will, so `/properties/in/andheri-west`
(or similar) can never be shadowed by a listing. The field's `validate` also
rejects a short reserved list — `in`, `all`, `new`, `page`, `search`,
`properties`, `projects`.

*Consequences:*

- **Never migrate existing slugs.** Records created before this hook keep
  whatever they have, including the mixed-case `New1` and `Andheri`. Those URLs
  are live.
- `publicSlugWhere()` uses `equals`, which is case-sensitive in Postgres. Do
  **not** lowercase the incoming route parameter to "normalise" lookups — it
  would break exactly those legacy records.
- The field's `validate` enforces the strict lowercase-hyphen shape on `create`
  only. On `update` it allows anything without URL-breaking characters, so a
  legacy record stays editable.
- `slug` stays `required: true` for the NOT NULL column. A custom `validate`
  fully replaces Payload's default check, which is what permits an empty value
  in the admin on create. The hook runs in collection-level `beforeChange`,
  which Payload executes *before* field validation — and after `assignPropertyId`,
  which is why it cannot be a `beforeValidate` hook.
- Slug generation is deterministic local code, never an AI call. A URL is a
  permanent public commitment; the inputs are already structured enums; and a
  network call in a write hook adds latency, cost and a failure mode for no
  gain. This matches the existing brochure-convert pattern, where AI produces a
  proposal outside the app and deterministic server code persists it.

## Interface text is unselectable; content is not

`src/index.css` marks real controls (`button, summary, [role="button"]`)
`user-select: none` at zero specificity, and decorative text opts in with
Tailwind's `select-none` on the element. Meaningful content — titles,
descriptions, prices, addresses, contact details — stays selectable and
copyable. Do not make the site broadly unselectable.
