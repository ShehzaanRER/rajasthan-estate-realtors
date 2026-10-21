# Public routes

All public routes live under `app/(website)/`, which supplies the shared
layout (Navbar, Footer, enquiry popup, site metadata, JSON-LD for
`RealEstateAgent`). Every page is a server component; data is fetched in the
route file and passed down as props.

| Route | File | Powered by |
| --- | --- | --- |
| `/` | `page.jsx` | `getPropertyLocalities()`, `getFeaturedProperties({ limit: 3 })`, `getProjects({ isNew: true, limit: 3 })`, `getChannelPartners()` |
| `/properties` | `properties/page.jsx` | `getProperties(filters)` + `getPropertyLocalities(scope)` + `resolveLocalitySlug()` |
| `/properties/[slug]` | `properties/[slug]/page.jsx` | `getPropertyBySlug(slug)` + `getSimilarProperties()` |
| `/projects` | `projects/page.jsx` | `getProjects(filters)` |
| `/projects/[slug]` | `projects/[slug]/page.jsx` | `getProjectBySlug(slug)` + `getRelatedProjects(project)` |
| `/about` | `about/page.jsx` | Static content + `lib/siteConfig` |
| `/contact` | `contact/page.jsx` | Static content + `lib/siteConfig`; reads an `intent` search param to preselect the form subject |
| `/privacy-policy`, `/terms` | respective `page.jsx` | Static content + `lib/siteConfig` |
| `/sitemap.xml` | `app/sitemap.ts` | `getProperties()` + `getProjects()` |
| `/robots.txt` | `app/robots.ts` | Static; disallows `/admin` and `/api` |
| `/manifest.webmanifest` | `app/manifest.ts` | Static; icons from `public/` |
| `/icon.png`, `/apple-icon.png` | file conventions | Static brand mark |
| *anything unmatched* | `[...notFound]/page.jsx` | Calls `notFound()` — HTTP 404, branded page |

`/properties`, `/projects`, `/about` and `/contact` open with
`components/ui/PageBanner`; the homepage `Hero` and Our Story photograph use
the same Website Banners data (`lib/website-banners`, `getBanner()` /
`getHomeBanners()`); see `ARCHITECTURE.md` › Page banners. Detail pages,
Privacy, Terms and the 404 keep their own headers.

Rendering: `/` and `/about` are prerendered static pages; publishing a banner
revalidates exactly that path. `/properties`, `/projects` and `/contact` read
search params and render per request.

Supporting files: `properties/(listing)/loading.jsx` and
`projects/(listing)/loading.jsx`, `error.jsx`, `not-found.jsx`.

**The `(listing)` route group is load-bearing, not cosmetic.** It adds nothing
to the URL — `/properties` and `/projects` are unchanged — and exists solely to
keep the listing skeleton's Suspense boundary off the `[slug]` detail routes.
A `loading.jsx` anywhere above a page makes Next stream the shell and commit
HTTP 200 before the page body runs, so `notFound()` can then only swap the UI:
every missing, draft, sold and rented listing URL answered 200 instead of 404.
The detail routes therefore have no `loading.jsx` of their own either.

*Do not add a `loading.jsx` at `properties/` or `projects/` level, do not add
one under `[slug]/`, and do not add one above `[...notFound]/` — any of them
reintroduces the soft 404.* See `DECISIONS.md`.

**`[...notFound]` is what makes an unmatched URL branded.** The app has two
root layouts, so Next could not choose one for a URL that matched no route at
all and served its own bare 404 screen instead — correct status, but no
Navbar, no Footer and no route back into the site. Claiming those URLs inside
`(website)` gives Next an unambiguous layout; the page calls `notFound()` and
nothing else. It is the lowest-priority route in the app, so every real route
— including `/admin/*`, `/api/*`, `/sitemap.xml` and both `[slug]` routes —
still wins. See `DECISIONS.md`.

Non-page endpoints: `POST /api/contact` (writes a `contact-inquiries` record),
`/admin/*` (Payload panel) and `/api/*` (Payload API, including
`/api/media/file/:filename` which streams uploads).

## Listing filters

`/properties` accepts purpose, category, locality, BHK and budget via search
params. The dialect is owned by `lib/properties/filterParams.ts`. An older
single `type` parameter is translated by `legacyTypeToFilters()` and then
**redirected** so only one dialect reaches the rest of the page. Locality
options are derived from live inventory in the current scope, so the filter
never offers a place with nothing behind it.

`/projects` filters on project type and status through
`lib/projects/filterParams.ts`.

## Visibility rules

Visibility is decided in the query layer, not by hiding cards in the UI.

**Properties** are public only when `status` is `available` or `under-offer`
(`PUBLIC_STATUSES` in `lib/properties/publicScope.ts`). Therefore a `draft`,
`sold` or **`rented`** property:

- remains in Payload, fully intact, for staff;
- is excluded from `/properties` and from every public feed
  (`getProperties`, `getFeaturedProperties`, `getSimilarProperties`);
- does not render through its public slug — `getPropertyBySlug()` applies
  `publicSlugWhere()` and returns `null`, and the route calls `notFound()`, so
  `/properties/<slug>` is a genuine 404;
- does not appear in `/sitemap.xml`, which is built from `getProperties()`.

This is enforced twice over: the collection's own `read` access already
constrains unauthenticated reads to `PUBLIC_STATUSES`, and every public query
additionally passes `publicStatusWhere()` with `overrideAccess: false`.

The internal `rentDetails` group is separately protected by field-level read
access (signed-in users only) and is not referenced anywhere under `app/`,
`components/` or `lib/`.

**Projects** are public for every status except `draft`
(`PUBLIC_PROJECT_STATUSES`), with the same slug/404 and sitemap behaviour via
`publicProjectSlugWhere()`.

**Website banners** are used only when `_status` is `published` and `enabled`
is checked (query, public read access, and `mapWebsiteBanner()`). Otherwise the
placement renders its built-in design. `/properties?for=rent|lease` uses the
`rentals` placement and `?category=commercial` the `commercial` one (commercial
wins), each falling back to `properties`.

**Channel partners** appear only when `active` is checked, ordered by
`displayOrder` then `name`. They are homepage-only and have no route of their
own; a partner with no `websiteUrl` renders as a non-clickable card rather than
an empty link.
