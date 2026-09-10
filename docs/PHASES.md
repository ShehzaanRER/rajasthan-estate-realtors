# RER Website Development Roadmap

Current status: Phases 1–7 complete. Phase 10 (property data architecture) and Phase 11 (database) complete. Phase 12 (admin panel) substantially complete via Payload's built-in admin, plus a custom Nearby Connectivity admin tool not originally scoped in this roadmap. Phases 8, 9, 13, 14, 15, 16 not started.

Do not skip phases. Stability before redesign. Architecture before database. Property model before admin panel.

---

## Phase 0 — Discovery & Audit
Status: COMPLETE

- Existing React/Vite website audited
- Existing routes identified
- Components identified
- Backend reviewed
- SEO gaps identified
- Property data issues identified
- Migration risks documented

---

# Phase 1 — Next.js Foundation
Status: COMPLETE

Completed:

- Next.js installed
- App Router created
- Tailwind/PostCSS configured
- Next config created
- Root layout created
- Temporary homepage created
- Production build verified
- Git migration branch created
- Foundation pushed to GitHub

---

# Phase 2 — Global Shell
Status: COMPLETE

Completed:

- Navbar migrated
- Footer migrated
- Footer CTA behavior migrated
- Global layout updated
- Internal navigation moved toward Next.js Link
- Build verified
- Git checkpoint created

---

# Phase 3 — Homepage Migration
Status: COMPLETE

All sections below are migrated into `app/(website)/page.jsx`: HeroSlider, FloatingWhatsapp, PropertySearch, FeaturedProperties, AboutTeaser.

FeaturedProperties was migrated in two steps: first as a direct port of the Vite component (still reading `src/data/properties.js`), then rewritten to read live data from Payload via `getFeaturedProperties()`. No component reads from `src/data/properties.js` anymore.

## 3A — HeroSlider

Migrate existing HeroSlider without redesign.

Requirements:

- preserve current functionality
- preserve slider controls
- preserve responsiveness
- identify mobile issues
- keep client-side code isolated

## 3B — Floating WhatsApp

Migrate existing component.

## 3C — Property Search

Migrate current visual component.

Do not build full database filtering yet.

## 3D — Featured Properties

Migrate current component.

Fix obvious property data mismatch where appropriate.

## 3E — About Teaser

Migrate current component.

## 3F — Homepage Verification

Verify complete homepage:

Navbar
Hero
Floating WhatsApp
Search
Featured Properties
About
Footer

---

# Phase 4 — About Page
Status: COMPLETE

Migrate:

/about

Include:

- founder
- history
- story
- RER positioning
- trust
- legacy

Founder:

Mr. Hanif Zamindar
Founder / Proprietor

---

# Phase 5 — Properties Listing
Status: COMPLETE (basic filters; controlled-tag UI not yet built)

Implemented at `app/(website)/properties/page.jsx` via `components/properties/PropertiesListing.jsx` and `lib/properties/getProperties.ts`. Supports `?type=buy|rent|commercial` query filtering (purpose/category) against live Payload data.

Remaining from original scope:

- controlled tags are not yet exposed as listing filters
- no pagination beyond the current fixed limit

---

# Phase 6 — Dynamic Property Pages
Status: COMPLETE

Implemented at `app/(website)/properties/[slug]/page.jsx` via `lib/properties/getPropertyBySlug.ts` and `components/properties/PropertyDetail.jsx` / `PropertyGallery.jsx`. Slug-driven lookup is scoped to public statuses (`available`, `under-offer`) via `publicSlugWhere()` — this is the fix for the known Vite-era bug where PropertyDetails used a fixed property instead of reading the slug.

---

# Phase 7 — Mobile Optimisation
Status: COMPLETE for Home and About (per commit `5acdd62`). Properties listing/detail pages not yet reviewed for mobile.

Review every major page at:

- mobile
- tablet
- desktop

Priority:

- hero
- navbar
- property cards
- search
- typography
- spacing
- footer

---

# Phase 8 — Homepage Redesign

Only after the technical migration is stable.

Review:

- current homepage
- competitor sites
- user journeys
- SEO requirements
- lead generation
- visual hierarchy

Goals:

- reduce unnecessary sections
- improve clarity
- add New Developments
- improve property presentation
- improve hero
- improve mobile

---

# Phase 9 — SEO Implementation

Implement:

- metadata
- canonical URLs
- sitemap
- robots
- structured data
- internal linking
- location architecture
- property SEO
- Open Graph
- image SEO

---

# Phase 10 — Property Data Architecture
Status: COMPLETE, except project/development model

Implemented in `collections/Properties.ts`: property model, tags, statuses, locations (including lat/lng for nearby-connectivity generation), transaction types (sale/rent/lease), property types, permanent auto-assigned `propertyId` (via `collections/hooks/assignPropertyId.ts`), amenities relationship (`collections/Amenities.ts`), and media (`collections/Media.ts`).

Not implemented: a dedicated project/development (builder/project) model or relationship. Every property is currently standalone.

---

# Phase 11 — Database
Status: COMPLETE (PostgreSQL via Payload's `@payloadcms/db-postgres` adapter), except developments and enquiries

Implemented: properties, locations, tags, amenities, media, users/admins, all in PostgreSQL via `payload.config.ts`.

Not implemented: a developments/projects table, and no enquiry-capture storage yet.

---

# Phase 12 — Admin Panel
Status: SUBSTANTIALLY COMPLETE via Payload's built-in admin UI at `app/(payload)/admin/`

Provided out of the box by Payload: authentication, dashboard, property CRUD, image management, tags, featured-properties marking (via the `featured` tag), publishing/status management.

Also built, ahead of this roadmap's original scope: a custom admin field component (`components/payload/GenerateNearbyLocations.tsx`) that calls a custom collection endpoint (`collections/endpoints/generateNearbyLocations.ts`) to suggest nearby places from Google Places for a property, based on `lib/nearby-locations/`.

Not implemented: a dedicated new-developments/projects admin flow (depends on the Phase 10 project/development model, which does not exist yet).

---

# Phase 13 — Lead Generation

Build/optimize:

- enquiry forms
- WhatsApp flows
- call actions
- seller/landlord lead capture
- property enquiry capture

---

# Phase 14 — Analytics

Potential:

- Google Analytics
- Search Console
- conversion tracking
- enquiry tracking

Final analytics stack to be approved.

---

# Phase 15 — QA

Test:

- mobile
- desktop
- browsers
- links
- forms
- property pages
- SEO
- accessibility
- performance
- security
- images
- metadata

---

# Phase 16 — Deployment

Final:

- production environment
- environment variables
- domain
- SSL
- DNS
- hosting
- database
- backups
- monitoring
- Search Console
- sitemap submission

---

# Current Rule

Do not skip phases simply because a later feature seems interesting.

Stability before redesign.

Architecture before database.

Property model before admin panel.