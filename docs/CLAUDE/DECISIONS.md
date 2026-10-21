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
`lib/properties/slug.ts`). Nothing regenerates it automatically afterwards:
editing the title, locality, BHK, purpose or price leaves the slug alone, and
the hook returns untouched whenever `operation !== 'create'` or a slug already
exists. The single exception is an explicit staff click — see the escape hatch
below.

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

### The one escape hatch is a button, not a hook

"Frozen" means *no code rewrites a slug on its own*. It does not mean the value
can never be corrected — two cases genuinely need correcting, and before this
the only route was retyping the slug by hand:

1. **Duplication.** Payload's duplicate runs as a `create`, so `assignPropertySlug`
   does regenerate the slug — but by then the field-level `beforeValidate` pass
   has hydrated `data` from the source document (`getFallbackValue()` copies any
   field absent from the incoming payload, and the admin's duplicate request
   sends an empty body). The duplicate therefore gets a *fresh RER ID* wrapped in
   the *source listing's* descriptive tokens. Edit it into a different unit and
   the slug still describes the one it was copied from.
2. **Correction.** A locality, BHK or property-type typo fixed after creation
   leaves the slug quoting the wrong value permanently.

`components/payload/RegenerateSlugButton.tsx` — the **Slug Update** button beside
the field — rebuilds the slug from the live form state by calling the *same*
`buildPropertySlug()` the create hook uses. It is registered as the field's
`afterInput` component.

*Consequences:*

- The escape hatch stays a deliberate human action. Nothing about this weakens
  the create-only rule above; there is still no hook that can rewrite a URL.
- It computes client-side and needs no endpoint, because the slug is a pure
  function of four values that are all in the form. One slug format, one
  implementation — a `/regenerate-slug` endpoint would be a second place to
  update whenever the format changes.
- It needs no uniqueness query either: the regenerated slug ends in this
  property's own permanent RER ID.
- It writes to form state only and marks the document modified, so the change is
  discarded by navigating away and applied by Save — the same contract as
  **Generate Nearby Locations**.
- It dispatches `{ type: 'UPDATE', path: 'slug' }` rather than mounting a second
  `useField({ path: 'slug' })`. The reducer's `UPDATE` case merges only the keys
  it is handed, so the field keeps its registered `validate`; a second `useField`
  would re-register the field without it.
- The button is disabled until the property has a `propertyId`, i.e. until it has
  been saved once. There is no unique tail to build on before that.
- **Projects have no equivalent** and should not get one by symmetry: their slug
  is hand-entered, with no generator to re-run.

## Property ID on CSV import: prime the sequence, never bypass the hook

`scripts/import-properties.ts` needs to create properties with an exact,
pre-decided `propertyId` (e.g. `RER-00008`) rather than whatever
`assignPropertyId` would allocate next. `assignPropertyId` unconditionally
overwrites `data.propertyId` from `rer_property_id_seq` on every `create`
(`collections/hooks/assignPropertyId.ts`) and cannot be passed an arbitrary
value — and per the import's own ground rules, that hook is not something an
import script gets to change.

The resolution: before creating a row whose target number is the sequence's
next value (or later), the script calls
`setval('rer_property_id_seq', target, false)` so the very next `nextval()`
— the one `assignPropertyId` itself calls — produces exactly `target`.
`is_called = false` means "`target` itself has not been consumed yet," so
`nextval()` returns it directly with no increment — deliberately not
`setval(seq, target - 1, true)` (increment-then-return), which is
off-by-one-equivalent in *effect* but breaks outright when `target` is `1`:
sequences have `MINVALUE 1`, and `setval(seq, 0, ...)` is rejected as out of
bounds. This surfaced directly during the first real apply, when the business
asked this batch to start at `RER-00001`. This never bypasses the hook, never
reformats the ID string that gets stored, and is the same *category* of
operation `syncIdSequence.ts` already performs on every boot (moving the
sequence forward to match reality). It only works for IDs matching the
sequence's own `RER-<digits>` shape; anything else is reported for manual
review rather than forced through.

Before priming, the script pre-validates every CREATE row's target number
against the sequence's current position, in ascending order, so the whole
batch is confirmed collision-free before any write happens — skipping unused
numbers going forward is safe (mirrors `syncIdSequence.ts`), but a target
number the sequence has already passed is not, and aborts the import before
any row is written.

*Consequence:* a future bulk-import script for a sequence-backed permanent ID
(Property or Project) should follow the same pattern — prime-then-create,
pre-validated in ascending order — rather than writing directly to the ID
column or relaxing the collection's own `update: () => false` access on that
field.

## Agreement End Date is the last day of the term, inclusive

`calculateAgreementEndDate()` (`lib/properties/agreementDates.ts`) originally
computed Start Date + Term Months with no further adjustment — landing on the
day the *next* term would begin, not the last day of *this* one. Real RER
tenancy agreements state the end date as the last calendar day of the term
(an 11-month lease starting 1 Feb 2026 ends 31 Dec 2026, not 1 Jan 2027), so
every row of the first real CSV import showed a spurious one-day
"discrepancy" against the CSV's own stated end dates.

Fixed at the source: the function now subtracts one calendar day from the
month-addition result (`addMonthsClamped(start, months)` unchanged, followed
by `setUTCDate(date - 1)`, which correctly rolls back across a month/year
boundary — 1 Mar minus a day lands on the last day of February, leap years
included). Both call sites (`rentDetails.agreementEndDate` and
`rentHistory[].agreementEndDate` in `collections/Properties.ts`) pick this up
automatically since they both call the one shared function — no
collection-level change was needed.

*Consequence:* do not reintroduce a second date-math implementation anywhere
(the CSV importer never had its own — it always deferred to this function for
its MATCH/DISCREPANCY comparison, which is why fixing the one utility was
sufficient to make every CSV row's comparison report MATCH).

## Property ID range for the first CSV import: an explicit, opt-in override

The first CSV batch arrived with Property IDs `RER-00008`–`RER-00025` (see the
sequence-priming decision below), but the business wanted this specific
batch — the very first properties in the system — renumbered to start at
`RER-00001` instead. `assignPropertyId` was still not modified: the CSV's own
`Property ID` column is not what got primed into the sequence for this run.

`scripts/import-properties.ts` supports an explicit `IMPORT_PROPERTY_ID_START`
environment variable: when set, every CSV data row (in file order) is
assigned a sequential target ID starting at that number, and **all**
create/match/collision logic — the sequence-priming target, the
already-exists check, the post-create verification — uses that assigned ID
instead of the CSV's own column value. The CSV's original Property ID text is
still shown alongside the assigned one in every report line, for audit
purposes. Without the environment variable set, the script's default
behaviour is completely unchanged: it trusts the CSV's own Property ID
column, exactly as originally specified.

This is deliberately an explicit, per-run opt-in — not a new ID generation
system, and not a change to the collection's own lifecycle. The one
accepted consequence: if anyone ever re-runs the *original, unmodified* CSV
file (the one whose own column says `RER-00008`–`RER-00025`) without setting
the environment variable again, `RER-00008` will not be found under that
exact string (it is actually stored as `RER-00001`), and the script's
existing sequence-floor pre-flight check will refuse to create it a second
time under a now-already-passed number — it aborts with a clear structural
error rather than silently creating a colliding or duplicate record.

## currentAgreementEndDate: denormalized because virtual fields can't be sorted

The property list needed to answer "which agreements expire in the next 60
days?" — sorted, the way a spreadsheet column sorts. Payload's list view
sorts and filters via a direct database query (`ORDER BY`/`WHERE`), which
runs *before* any `afterRead` hook executes — so a `virtual: true` field
(computed only at read time, never stored) cannot be sorted or filtered from
the list view. A `type: 'ui'` field is even less useful here: no database
presence at all, not even queryable via the Local API.

The resolution is a genuine, stored, denormalized column
(`currentAgreementEndDate`), kept in sync by a `beforeChange` hook on the
field itself, copied from the LAST (current) `rentHistory` entry every time
the property is saved.

**The hook does not read `rentHistory[last].agreementEndDate`.** That value
is itself produced by that array row's own `beforeChange` hook, in the same
save — and Payload's field-hook execution order follows field *declaration*
order. `currentAgreementEndDate` is declared before `rentHistory` in the
Rent Details tab (so it appears above the Tenancy History array on the edit
page, per how staff actually use it), which means its hook would very likely
run *before* the row's own hook has finished computing, reading a stale or
not-yet-derived value. Instead, the hook recomputes independently — the same
`calculateAgreementEndDate(startDate, termMonths)` call the row's own hook
makes, called a second time from the last row's own start date and term —
which makes correctness independent of hook-execution order entirely, rather
than fragile-but-usually-right. This is not new duplication: two call sites
(the legacy `rentDetails` hook and the `rentHistory[]` row hook) already call
this exact same central utility independently; this is a third.

Falls back to the row's own stored `agreementEndDate` only when a fresh
calculation isn't possible (a historical entry with a manually-entered end
date and no term months) — never blanks out a genuine existing value just
because it can't be recomputed.

Explicitly gated `access.read: ({ req: { user } }) => Boolean(user)`, matching
`rentHistory`. Unlike the 4 owner-relationship fields added the same day
(which sit *inside* the already-gated `ownerDetails` group and inherit its
gate for free), this is a new top-level field — it does not automatically
inherit anything from `rentHistory`, so the gate had to be applied here
explicitly. Verified directly: an authenticated Local API read returns the
real value; an unauthenticated one returns nothing (today, because `rented`
already isn't a public status at the collection level — the field gate is the
second, independent layer that would still apply the day a property with a
populated tenancy history *is* public).

`scripts/backfill-current-agreement-end-date.ts` was required — and run — for
the 18 already-imported properties, because a *hook-computed* field is not
backfilled by Postgres's own schema push the way a field with a static
`defaultValue` is. Confirmed by direct comparison: `openToSelling` (added the
same session, `defaultValue: 'not-discussed'`, no hook) *did* come back
populated for existing rows straight from a raw `SELECT *` — Postgres applies
a column's SQL-level default to existing rows on `ALTER TABLE ADD COLUMN`,
which corrects an earlier claim in this project's own history that existing
records "stay blank until next edit." That claim is only true for
hook-derived fields with no static default, which is exactly why this one
field got its own backfill script and the owner fields did not.

## Owner Details, Parking and Parking Charges added deliberately, not to "fit the CSV"

The first CSV import dry run surfaced several columns with real, populated
data and no destination field: `Owner Name`, `Owner Contact`, `Parking`,
`Parking Charges`, plus others (`Source`, `Photos`, `Assigned To`, etc.). Per
an explicit, scoped decision — not an automatic "add a field for every
unmapped column" reflex — three of these got a minimal destination:

- **Owner Details tab** (`ownerDetails` group: `ownerName`, `ownerContact`
  only). Gated with the same field-level `access.read: Boolean(user)` as
  `rentDetails`/`rentHistory`/`location.flatNo`, because owner identity is
  exactly the same category of internal-only inventory data. Deliberately not
  copied when a property is duplicated is **not** enforced with a
  `beforeDuplicate` hook — `location.flatNo` (an equally unit-specific field)
  isn't either, so a duplicated property carries the source owner across the
  same way it carries the source flat number, both expected to be corrected by
  hand. Adding special-case clearing here without doing so for `flatNo` would
  be an inconsistent one-off.
- **`details.parking`** (a plain number — count of parking spots). Placed
  next to `furnishing` rather than in the residential- or commercial-only
  blocks, because parking applies to both categories. `"None"` in the CSV
  means zero, not "unknown" — the import script's `parseParking()` maps it to
  `0` rather than leaving the field blank.
- **`pricing.parkingCharges`** (a plain number, no `purpose` condition). Every
  other charge in the `pricing` group is gated to the purpose it makes sense
  for (`pricePerSqFt`/`additionalCharges` → sale, `brokerageFee` → rent, …).
  Parking charges don't fit that pattern — a one-off charge on a sale and a
  recurring charge on a rental are both plausible — so it stays ungated rather
  than guessing a restriction the CSV data didn't demonstrate.

The remaining unmapped columns (`Source`, `Source Contact`, `Photos`, `Video`,
`Documents`, `Owner Permission`, `Last Verified`, `Next Verification`,
`Listing Ready`, `Website`, `Portals`, `Assigned To`, `Remarks`) were
deliberately left unmapped — they are blank throughout the first real CSV, and
several of them (`Photos`, `Remarks`) carry a real risk of fabricating media
references or leaking internal notes if a field were added just to hold them.
Do not add fields for these without a similar explicit, scoped decision.

*Consequence:* schema changes driven by a data-import mapping gap are a
one-column-at-a-time decision, never a blanket "add a field for every
unmapped CSV column."

No migration file was created for this change. The project has no
`migrations/` directory and no `migrationDir`/`push` option set on
`postgresAdapter()` in `payload.config.ts` — the Postgres adapter pushes
schema changes automatically on boot outside of `NODE_ENV=production`, the
same way every prior field addition to this collection (`rentHistory`
included) has reached the database. Regenerated `payload-types.ts` via
`npx payload generate:types` accordingly. The new fields are additive
(nullable columns) with no default value, so existing rows are simply `null`
for them until data is written — no backfill of any kind was performed
alongside the schema change, since the actual CSV import is a separate,
still-unapplied step.

## Interface text is unselectable; content is not

`src/index.css` marks real controls (`button, summary, [role="button"]`)
`user-select: none` at zero specificity, and decorative text opts in with
Tailwind's `select-none` on the element. Meaningful content — titles,
descriptions, prices, addresses, contact details — stays selectable and
copyable. Do not make the site broadly unselectable.

## List-table column width is tier-based, not per-collection

Properties and Projects list tables were both unreadably wide because of two
compounding causes in `@payloadcms/ui`, not anything RER-specific: `Table/
index.scss` gives every `th`/`td` the same `min-width: 150px` with **no**
`max-width`, and `SortColumn/index.scss`'s `.sort-column__label` forces the
header onto one line (`white-space: nowrap; text-overflow: ellipsis`). With no
ceiling and no way for a long nested-field header (`Building Details >
Building Name`) to wrap, the column's width becomes "however wide that one
line is" — the cell content was never the problem; it already wraps via
`List/index.scss`'s `-webkit-line-clamp: 4`.

Fixed in `app/(payload)/custom.scss` §8 by (1) letting the header label wrap
onto two lines instead of overriding it to something shorter, and (2) sizing
columns by **field-name tier** (id / countdown-pill / plain-date / status /
price / text-heavy) rather than by collection or by hardcoding every
accessor. The tier selectors match on Payload's generated `heading-<accessor>`
id / `cell-<accessor>` class using an ends-with match for one-level-nested
fields (`[id$="__address"]`), so the same field name gets the same width and
alignment on both Properties and Projects, and a column keeps its tier even if
it gets re-nested under a different group later.

*Consequence:* a new list column needs a tier added to custom.scss §8.3 only
if it doesn't already fit an existing one (id/date/status/price/text) — do not
hand-roll a one-off width for a single collection's column when the field
shape already matches a tier that exists.

## No sticky list-table header — Payload's own scroll container blocks it

`position: sticky` needs its nearest `overflow`-not-`visible` ancestor to
actually be the thing that scrolls. `.table` (Payload's list-table container)
is `overflow: auto`, which makes IT the sticky containing block regardless of
whether it ever shows a scrollbar — and it never does vertically, since
nothing constrains its height; the div just grows to fit every row. A sticky
`thead th` inside it would therefore stick to the top of a box that never
scrolls, i.e. do nothing, while silently breaking sticky's normal
viewport-relative behavior.

Making it actually work would mean giving `.table` a fixed max-height and its
own vertical scrollbar — turning the whole list into an internally-scrolling
panel — which conflicts with `.collection-list__list-selection`'s existing
`position: fixed; bottom: 0` bulk-actions bar and with page-level pagination,
both of which assume the *page* scrolls, not the table. Per the explicit
instruction not to fight Payload's scrolling architecture for this, sticky
headers were left alone; only the synchronized top+bottom horizontal scroll
(`components/payload/TableScrollSync.tsx`) was added instead.

*Consequence:* do not add `position: sticky` to `.table thead th` without
first giving `.table` a real bounded height — and if that's ever done,
re-check the bulk-selection bar and `PageControls` for the page-scroll
assumption above.

## The admin landing page is a replaced dashboard view, not a widget

Payload 3.88 offers three ways to put RER content on `/admin`, and only one
of them is right for an operations console:

- `admin.components.afterDashboard` — appends below Payload's own dashboard.
  This is what the old `AdminDashboardSummary` used. It can only ever be a
  footnote under the collection cards; it cannot own the page.
- `admin.dashboard.widgets` — the modular drag-and-drop widget API. It is
  marked `@experimental` in this version, and its layout is stored in **user
  preferences**: `ModularDashboard` reads `getItemsFromPreferences()` first
  and only falls back to `defaultLayout`. A staff member who had already
  arranged their dashboard would never see a changed default.
- `admin.components.views.dashboard` — replaces the dashboard **body**. This
  is what the console uses.

The third is the smallest change that still lets the console be the page.
Payload's `DashboardView` keeps wrapping it with `HydrateAuthProvider` and
`SetStepNav`, so auth hydration and the breadcrumb bar are unchanged, and
nothing outside `/admin` itself is touched — the nav rail, the account menu,
every collection list and edit route, and the `/admin/brochure-convert` view
all still work exactly as before.

What it *does* replace is Payload's `collections` widget (the card grid). That
grid is the only place in the admin offering a per-collection "create" link
next to its list, so the console ends with `ConsoleCollections`, built from
the same permission-filtered `navGroups` server prop the nav rail uses.

*Consequence:* `AdminDashboardSummary` was deleted rather than kept — the
console is a strict superset of it, and leaving both would have rendered the
same counts twice.

## Every console number is a `count()` over the `Where` its link opens

Each metric tile and each Needs Attention row is defined once, as a Payload
`Where`. That single object is both counted (`payload.count({ where })`) and
serialized into the row's href by `stringifyWhere()`, which produces the
bracket notation the admin list view parses back out of the URL
(`where[status][equals]=rented`). Clicking "18 Rented" therefore opens
*exactly* the eighteen records that produced the 18.

The alternative considered was one `find()` per collection with
`pagination: false`, computing every figure in TypeScript. It is far fewer
queries, but it needs the check expressed twice — once as a predicate for the
count, once as a `Where` for the link — which is exactly the kind of drift
`lib/properties/agreementCountdown.ts` was extracted to prevent. It also goes
silently wrong the moment a collection outgrows what was fetched.

The cost is real and accepted: the console issues roughly thirty small counts
per load, all inside one `Promise.all`. At RER's scale (tens of properties)
these are trivial, and correctness that cannot drift is worth more than the
round trips.

*Consequence:* a new metric or check is one entry with a `Where` — never a
count and a link written separately. If a future check genuinely cannot be
expressed as a `Where`, it does not belong in this panel, because there would
be no honest list to send the user to.

## Needs Attention only ever checks optional fields

Every check in `lib/admin-console/checks.ts` targets a field Payload lets
staff leave empty. "Missing title", "missing locality", "missing developer"
and similar are **not** checks and must not be added: those fields are
`required: true`, so a saved record cannot be missing them, and the check
would be a permanently-zero row implying the system might produce data it
cannot produce.

Checks deliberately do **not** filter by status. A draft with gaps is still a
draft with gaps, and RER's rented inventory is actively managed even though
it is not public — scoping to public records would hide exactly the records
staff spend the most time in.

Severity encodes urgency, not size: `high` is reserved for gaps that damage a
listing the moment it goes public (featured image, price) or that block
operational follow-up (owner contact, agreement end date). The panel sorts by
severity before count, so the top row is the most consequential rather than
merely the largest.

*Consequence:* before adding a check, confirm the field is optional in
`collections/`, and confirm the `Where` actually returns what you think —
several candidate clauses here were run against the real database first.

## Console status tiles are generated from the schema, not listed alongside it

`lib/admin-console/selectOptions.ts` reads the `status` field's own `options`
out of the sanitized config and builds one tile per option. Nothing in the
console holds a copy of the status vocabulary.

This makes "do not invent statuses" structural rather than a rule someone has
to remember: a status added to `collections/Properties.ts` appears on the
dashboard with no change to the console, and a status that does not exist in
the schema cannot be rendered at all. It is the same reasoning as
`StatusBadge` reading its labels from the field it renders.

It also settles what the console will not show. There is no "Leased" tile,
because `lease` is a value of `purpose`, not of `status` — no such status
exists, so no such tile can exist. The only two groupings the console adds on
top of the raw options are `Total` and `Live on site`, and `Live on site`
reuses the existing `PUBLIC_STATUSES` / `PUBLIC_PROJECT_STATUSES` rather than
defining a third opinion about what "active" means.

## Status and countdown tiering live in `lib/`, not in the Cell that renders it

`STATUS_TIERS` / `TIER_STYLES` moved out of
`components/payload/StatusBadge.tsx` into `lib/statusTiers.ts`, and the
countdown badge styling out of `components/payload/AgreementCountdownCell.tsx`
into `lib/properties/agreementCountdown.ts` (which already owned the day-math
and the urgency threshold).

Both moves happened because the console needed to render the same badges, and
a component is the wrong home for something two components depend on. This is
the same call already recorded for `agreementCountdown.ts` itself: two places
rendering one value must not be able to disagree about what it means or what
colour it is.

The edit-page sidebar (`AgreementCountdownSidebar`) deliberately keeps its own
colour map — it renders coloured text, not a badge — but takes its tier from
the same shared `describeAgreementCountdown()`.

## `area`/`areaUnit` replaced by `carpetArea`/`builtUpArea`, migrated then dropped

`collections/Properties.ts`'s `details` group had one `area`/`areaUnit` pair
doing duty for every area figure. `scripts/import-properties.ts` already knew
this was a gap — its own comments said "Payload has only one details.area
field, and picking one would silently drop the other," and it errored out
rather than importing a row where both the CSV's Carpet Area and Built-up
Area columns were populated.

This went through two stages in the same session. First, `carpetArea`/
`carpetAreaUnit` and `builtUpArea`/`builtUpAreaUnit` were added *alongside*
the existing `area`/`areaUnit`, deliberately not replacing it yet — removal
would have required migrating live data and touching the public site's
rendering in the same change as the schema addition. Once added,
`scripts/migrate-area-to-carpet-area.ts` (dry-run first, then
`MIGRATE_AREA_TO_CARPET_APPLY=1`) copied every property's `area`/`areaUnit`
into `carpetArea`/`carpetAreaUnit` — a safe default, since every property
imported so far only ever had the one general figure. Verified by snapshotting
`details` for all 19 properties before and after: every sibling field
(`bedrooms`, `furnishing`, `parking`, …) was byte-for-byte unchanged, and
every `carpetArea` matched the `area` it replaced. `area`/`areaUnit` were then
removed from the schema, and the now-unrunnable migration script (its source
field no longer exists) was deleted — its work is recorded here instead of
kept as dead code.

Removing the fields is a Postgres **column drop with data**, which
`@payloadcms/drizzle`'s dev-mode schema push
(`pushDevSchema.js`) treats as a data-loss warning requiring interactive
confirmation via the `prompts` library — it does not detect a non-TTY
environment and auto-reject; it blocks on stdin indefinitely. Running it
through `payload run` in a non-interactive shell hangs with no output. Fixed
by piping the confirmation: `printf 'y\n' | npx payload run <script>`. This
applies to *any* future schema change removing a populated field, not just
this one.

Consumers updated in the same change: `lib/properties/mapProperty.ts` (and
`formatLocation.ts`'s `formatAreaDisplay()` signature) — `areaDisplay` now
prefers `carpetArea`, falling back to `builtUpArea`, mirroring the CSV
import's own carpet-preferred-over-built-up ordering. `lib/admin-console/
checks.ts`'s "no area recorded" check now tests both fields are absent.
`scripts/import-properties.ts` now writes both CSV columns to their own
field (CREATE) and can backfill either on an existing property via
`setIfChanged` (UPDATE) — the "both populated → error" validation was
removed since there is no longer a shared field to reconcile onto.
`scripts/seed-test-inventory.ts`'s five Property (not Project — `configurations[].carpetArea` was
already its own separate field and was not touched) test records were
renamed from `area`/`areaUnit` to `carpetArea`/`carpetAreaUnit` with the same
values, so QA inventory keeps carrying an area figure.

Both unit selects default to `sq-ft` (`defaultValue: 'sq-ft'`), matching
every property imported so far.

## The brand gold has two values: one for fills, one for text on light

`--color-rer-gold` (`#b8862f`) is the brand gold and is unchanged. It reaches
5.80:1 against the navy, so it is correct as text on a dark ground, as a
button fill under navy text, and as a rule or an icon anywhere.

As **text on a light ground** it is not: 3.24:1 on white and 2.97:1 on
`--color-rer-sand`, against the 4.5:1 WCAG AA needs for the 10-12px uppercase
eyebrow labels it was mostly used for. `--color-rer-gold-text` (`#8a6728`) is
the same hue with saturation 59.3% -> 55% and lightness 45.3% -> 35%: the
smallest move that clears AA on white, sand and sand-deep at once.

The split is also why gold badges and filter chips take navy text rather than
white. White on `#b8862f` is 3.24:1; navy on it is 5.80:1, which is what every
gold CTA on the site already did.

*Consequence:* gold on dark is `rer-gold`, gold **text** on light is
`rer-gold-text`, and a gold fill carries navy text. Do not use `rer-gold-text`
on the navy — it drops to 3.5:1.

## HTTPS is enforced with HSTS, not an application redirect

Railway terminates TLS at its edge and already answers plain HTTP with a
redirect. Adding an application-level `http -> https` redirect on top would be
writing a rule against `x-forwarded-proto` inside a process that only ever
sees decrypted requests — the classic way to produce a redirect loop when that
header is absent or rewritten.

What the platform does not send is HSTS, and that is the part that matters: it
removes the first plaintext hop, which is the request an attacker on a hostile
network actually intercepts. Two years with subdomains, production only.
`preload` is deliberately omitted — submission is effectively irreversible on
browser timelines and is the site owner's call.

*Consequence:* transport hardening belongs in `next.config.mjs`'s `headers()`,
not in a redirect or middleware.

## No cookie banner, because there is nothing to consent to

The site sets no cookies, runs no analytics and embeds no third-party tracker.
The only client storage is `lib/enquiryPopupStorage.ts`, which uses
`localStorage`/`sessionStorage` to remember that a visitor dismissed the
enquiry popup — strictly functional, first-party, never read server-side.

A banner here would be pure cost: an interstitial on every page, a focus trap
to get right, and a consent record to store, protecting nothing.

This is a live constraint, not a one-time observation. `components/Analytics.jsx`
is deliberately shaped around a cookieless, aggregate-only provider for exactly
this reason. Adding Google Analytics — or anything else that writes a cookie or
processes personal data — ends it, and means a real consent mechanism plus a
rewrite of the Cookies section of `/privacy-policy`.

*Consequence:* before adding any third-party script, check whether it sets a
cookie. If it does, the banner question reopens.

## Unmatched URLs are claimed by a catch-all so they get the branded 404

The app has two root layouts, `(website)` and `(payload)`, each rendering its
own `<html>`. When a URL matched no route at all, Next had no basis to choose
between them, could not render `(website)/not-found.jsx`, and fell back to its
built-in 404 screen — correct status, but no Navbar, no Footer, no branding and
no way back into the site. Only URLs that reached a real route and then called
`notFound()` themselves — a sold property, a draft project — got the RER page.

`app/(website)/[...notFound]/page.jsx` claims those URLs inside `(website)`,
which gives Next an unambiguous layout, and calls `notFound()`.

It is the lowest-priority route in the app: literal segments and named dynamic
segments both outrank a catch-all, so every real route still wins. Verified
against `/admin`, `/api/*`, `/sitemap.xml`, `/robots.txt` and both `[slug]`
routes in a production build.

*Consequence:* it changes which page an unmatched URL renders, never which
URLs are unmatched. The `loading.jsx` prohibition in `PUBLIC-ROUTES.md` applies
to it exactly as to the other routes.

## Webfonts are self-hosted through next/font

Cormorant Garamond was loaded by an `@import url(fonts.googleapis.com/...)` at
the top of `src/index.css` — the worst available option. The browser had to
fetch and parse that stylesheet before it even discovered the request, then
fetch a second stylesheet, then the font files: a three-deep chain in front of
first paint, plus every visitor's IP handed to a third party on every page
load.

It was also, until this pass, entirely wasted. `font-cormorant` had no matching
`--font-cormorant` key in the `@theme` block, so Tailwind emitted no rule for
it and both wordmarks rendered in the default sans while the face downloaded
anyway.

*Consequence:* `next/font` (part of Next, not a dependency) for any webfont,
and a `@theme` key for any font utility — a font utility with no theme key
fails silently.

## The contact endpoint is defended by counting, not by a captcha

`POST /api/contact` has three layers: a honeypot field, a minimum
render-to-submit interval, and a per-IP rate limit (`lib/rateLimit.ts`, 5 per
10 minutes). The first two inspect the shape of a single request, so a bot that
posts well-formed JSON and simply omits `renderedAt` passes both — only
counting requests catches repetition.

The limiter is a module-level Map, not Redis and not a package: RER runs as one
instance, the cost of being wrong is one extra enquiry row rather than a
security boundary, and a shared store would add a network round trip to every
submission. It does not survive a restart, and a horizontally scaled app would
give a flooder `instances x limit`. Both are acceptable for a contact form and
both are the reason to revisit it if the app is ever scaled out.

No captcha. The real protection is that the endpoint writes one narrow,
explicitly-constructed record — never a spread of the request body — and
returns nothing.

*Consequence:* reach for a captcha only if these three stop holding, and
prefer raising the cost of repetition over interrogating the visitor.

## The default social image is an explicit constant, not the file convention

`DEFAULT_OG_IMAGE` (`lib/seo/ogImage.ts`) is referenced by hand everywhere it
applies. Next's `opengraph-image.png` file convention was tried first and
silently under-delivered: it only reaches pages that do **not** declare an
`openGraph` object of their own, and Next replaces that object wholesale rather
than merging into it. `/about`, `/contact`, `/properties` and `/projects` all
set their own `openGraph` title/description/url, so all four dropped the
inherited image and shared with no preview at all.

*Consequence:* a page that sets `openGraph` must also set `images`. Detail
pages pass the listing's own first photograph and fall back to this constant.

## The repository is not a backup, and backups live outside it

Every piece of RER's actual content is remote: the Postgres database is hosted on
Supabase and every media file sits in a Supabase Storage bucket. The repo's
`media/` directory is empty and gitignored. Git therefore holds the code that
*renders* the business, and none of the business itself.

Two things follow, and they pull in opposite directions.

Migrating machines is nearly free — clone, `npm ci`, supply `.env`, done. There
is no database to restore, no media to copy and no PostgreSQL server to install,
so a setup guide that walks through `pg_restore` would be describing work that
does not exist.

But the repo being clean is not evidence the data is safe. A pushed commit backs
up nothing that editors have typed into the admin panel. Backups are a separate,
deliberate act, and their output must be stored **outside** the working tree:
a database export carries password hashes and customer contact details, and the
migration bundle also carries `.env` itself. `.gitignore` blocks `*.dump`,
`*.sql.gz`, `*-snapshot.json` and `rer-migration-backup*/` as a guard, but the
real protection is keeping the bundle out of the repository directory entirely.

*Consequence:* never commit a dump or a snapshot, and never treat a green
`git status` as a statement about the data. Local development also writes
straight to the one live database — there is no second environment — so
destructive experiments need a snapshot taken first.

*Consequence:* `.env` is the single laptop-bound asset, and `PAYLOAD_SECRET` is
the one value in it that cannot be recovered from any dashboard. Losing it logs
every admin out and invalidates outstanding reset tokens, though salted password
hashes survive.

## ID sequences are declared to Drizzle, not left as raw SQL (2026-10-19)

`rer_property_id_seq` / `rer_project_id_seq` were created only by raw
`CREATE SEQUENCE IF NOT EXISTS` in `onInit`. In development Payload runs in
push mode: drizzle-kit introspects every sequence in `public` and emits
`DROP SEQUENCE` for any not in the Drizzle schema. A push happens at boot and on
every HMR schema change, but `onInit` runs only at boot, so a mid-session
schema edit silently dropped the sequences and every property/project create
failed at `nextval`. Dev and production share one Supabase database, so this
hit the live ID counters.

*Decision:* declare both sequences with `pgSequence` in an `afterSchemaInit`
hook (`collections/hooks/idSequenceSchema.ts`), options identical to the
`ensure*` SQL so the push sees no drift. They travel in the hook's `enums` map,
the only non-table carrier Payload spreads into the schema given to drizzle-kit.
`onInit` ensure/sync stays as the production path (production never pushes) and
the allocator self-heals once on a missing sequence.

*Not chosen:* Payload migrations — the repo is push-based (`payload_migrations`
holds only the `dev` batch), and `payload migrate` against a push-mode database
prompts to wipe it; `NEW-LAPTOP-SETUP.md` already says not to run migrations.
A one-off manual SQL fix was rejected as non-permanent.
