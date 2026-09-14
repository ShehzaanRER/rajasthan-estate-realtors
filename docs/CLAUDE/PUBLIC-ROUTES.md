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

Supporting files: `properties/loading.jsx` and `projects/loading.jsx` for both
listing and detail routes, `error.jsx`, `not-found.jsx`.

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

**Channel partners** appear only when `active` is checked, ordered by
`displayOrder` then `name`. They are homepage-only and have no route of their
own; a partner with no `websiteUrl` renders as a non-clickable card rather than
an empty link.
