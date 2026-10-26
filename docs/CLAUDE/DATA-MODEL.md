# Data model

Collections live in `collections/` and are registered in `payload.config.ts`.
Generated types are in `payload-types.ts` (`npx payload generate:types`).

| Collection | Slug | Admin group | Purpose |
| --- | --- | --- | --- |
| Users | `users` | Admin | Auth for RER staff |
| Properties | `properties` | Listings | Physical units RER transacts on — the shared facts (address, specification, photos, owner, tenancy history) |
| Listings | `listings` | Listings | One sale, rental or lease offered on a property — price, terms, status, URL, tags, agent |
| Projects | `projects` | Listings | Developments |
| Amenities | `amenities` | Reference Data | Shared amenity master list |
| Channel Partners | `channel-partners` | Reference Data | RER developer inventory; drives the homepage partner strip |
| Media | `media` | Media Library | Every uploaded image |
| Contact Inquiries | `contact-inquiries` | Leads | Contact-form submissions |

## Properties

> **A Property is one physical unit; it is not a transaction.** Since the
> listings change, `purpose`, `pricing` and the editable `status` no longer
> describe anything — the sale/rent/lease offered on the unit is a **Listing**
> (next section). `purpose` and `pricing` remain in the schema as hidden *legacy*
> fields (the migration copies them onto the listing; nothing reads them), and
> `status` is a system-maintained roll-up of the listings. Read the Listings
> section first.

The largest collection. Fields sit in **unnamed** admin tabs, which are a
UI grouping only — no tab adds a path segment, so a field is at
`location.locality`, never `location.<tab>.locality`.

**Sidebar (always visible)**

- `propertyId` — permanent RER ID, system-assigned by
  `collections/hooks/assignPropertyId.ts` from the Postgres sequence
  `rer_property_id_seq`. Not editable.
- `mediaFolder` — relationship to the property's own Media folder, assigned by
  `collections/hooks/assignMediaFolder.ts`; `mediaFolderLink` is a UI field
  that links to it.
- `status` (required, default `draft`) — `draft`, `available`, `under-offer`,
  `sold`, `rented`. **Read-only and system-maintained:** the roll-up of the
  property's listings (`lib/listings/rollup.ts`, written by
  `collections/hooks/syncPropertyRollup.ts`; field `access.update` is `false`).
  Available if any listing is live, else Under offer, Rented, Sold, otherwise
  Draft (a property with no listings, or only withdrawn ones, is Draft). Rendered
  with the custom `StatusBadge` cell. It exists so the collection's public read
  access (`status in available/under-offer`) keeps working and so the console and
  list view keep their existing status counts — **public pages no longer use it
  to decide what is shown; each listing's own status does.**
- `isTenanted` (checkbox, hidden, read-only, indexed) — true while any Rent or
  Lease listing is `rented`. A flat can be for sale *and* let to a tenant, which a
  single status cannot say; renewal tracking, the agreement-countdown sidebar and
  the tenancy attention checks key off this, not `status`.
- `listingsSummary` (UI) — sidebar block and list-view Cell listing each
  listing's ID, type, status and price with links
  (`components/payload/PropertyListingsSummary.tsx`, `PropertyListingsCell.tsx`).

**Overview tab** — `title`, `slug`, `purpose` (legacy, hidden, optional — see
above), `propertyCategory` (`residential` / `commercial`), `propertyType` (apartment,
house, villa, office, shop, showroom, warehouse, land, other), `tags`
(multi-select: `new`, `featured`, `new-development`, `under-construction`,
`ready-to-move`, `premium`, `price-reduced`, `commercial`, `residential`),
`description` (Lexical rich text).

`slug` is generated on create only. It is the unit's master slug: the first
listing inherits it as *its* public URL (see Listings), and the route resolves a
property slug with no listing of its own to the property's leading public
listing. The **Slug Update**
button beside the field (`components/payload/RegenerateSlugButton.tsx`) rebuilds
it from the current BHK, property type, locality and RER ID — the way to fix a
duplicate's inherited slug, or one left stale by a later correction.

**Location tab** — `location` group (`locality` and `city` required; `area`,
`state`, `address`, `latitude`, `longitude` optional) and `nearbyConnectivity`
with a `connections` array (place `name`, `category`, `travelTimeMinutes`,
`distance` + `distanceUnit`, `displayOnWebsite`). Lat/long feed the
generate-nearby-locations endpoint; they are not required to save.

**Listings tab** — a Payload `join` field (`listings`, collection `listings`,
on `property`): the property's listings as a table (Listing ID, type, status,
price) with Payload's **Add new** drawer, which pre-selects this property so the
address, specification and photographs are never re-entered. A hidden legacy
`pricing` group sits beside it (same shape the Listings `pricing` group has
now): kept so the migration is expand-only, never read.

**Property Details tab** — `details` group (`bedrooms`, `bathrooms`,
`carpetArea` + `carpetAreaUnit` (default `sq-ft`), `builtUpArea` +
`builtUpAreaUnit` (default `sq-ft`), `furnishing`, `parking`, `balconies`,
`propertyAge`, `possessionStatus`, and the commercial-only `cabins`,
`workstations`, `meetingRooms`, `pantryAvailable`, `fitOutStatus`) and
`buildingDetails` (`buildingName`, `totalFloors`, `floorNumber`,
`liftAvailable`). `carpetArea` and `builtUpArea` are the precise RERA-style
figures, each with its own unit — added because the CSV import already
distinguishes the two source columns but previously had nowhere to put both
(see `DECISIONS.md`). There is no single generic `area` field: an earlier
version had one, all 19 properties' values were migrated into `carpetArea`,
and the field was then removed — `areaDisplay` (public site) now prefers
`carpetArea`, falling back to `builtUpArea`. `parking` is a plain number
(count of parking spots) — applies to both residential and commercial units,
so it sits alongside `furnishing` rather
than in either
category-conditional block.

**Amenities tab** — `amenities`, a has-many relationship to the `amenities`
collection. Amenities are never duplicated onto a listing.

**Media tab** — `media` group with `featuredImage` (single upload) and
`gallery` (has-many upload), both to `media`, both optional.

**Rent Details tab** — internal rental record, described next.

**Owner Details tab** — `ownerDetails` group: `ownerName`, `ownerContact`,
`ownerBasedIn` (`jogeshwari` / `elsewhere-in-mumbai` / `outside-mumbai` /
`nri`), `withRerSince` (4-digit year, validated: integer, 1000–9999, not in
the future), `openToSelling` (`not-discussed` default / `open-to-offers` /
`actively-selling` / `will-not-sell`), `renewalCalledOn` (date). Internal-only
— gated the same way as `rentDetails`/`rentHistory`/`flatNo`
(`access.read: ({ req: { user } }) => Boolean(user)`) **at the group level**,
so every field added to this group inherits the same protection with no
per-field access code needed. Nothing under `app/`, `components/` or `lib/`
reads this group, so it has no path to the public site.

### Featured / public behaviour

- A property is **readable by visitors only while it has a live listing** (its
  roll-up `status` is `available` / `under-offer`): the collection's `read`
  access returns that `where` for unauthenticated requests. What the public
  *site* shows is decided per **listing** — see Listings and `PUBLIC-ROUTES.md`.
- Featured is a **listing** tag (`publicFeaturedWhere()` on listings). The
  property's own `tags` keep their full option list for schema compatibility, but
  only the unit-level ones (`new-development`, `ready-to-move`, `commercial`, ...)
  are read by the site; a legacy `featured` left on a property does nothing.

### Rental architecture (implemented)

`Rented` is now a **listing** status (a Rent or Lease listing marked Rented);
`properties.isTenanted` mirrors it on the property. A rented listing is **retained
in Payload but excluded from public inventory**. `rented` is not in `PUBLIC_STATUSES`, so the
record stops appearing in listings, feeds, the detail route and the sitemap
while staying fully intact for staff. The same is true of `sold` and `draft` —
`rented` is not a special case in the query layer, it is simply another
non-public status.

The **Rent Details** tab holds the internal record in a `rentDetails` group:
`licenseeName`, `licenseeContactNumber`, `monthlyRent`, `securityDeposit`,
`agreementStartDate`, `agreementEndDate`, `agreementTerm`, `rentalSource`
(`direct` / `through-agent`), `agentName`, `agentContactNumber`, `rentalNotes`.

Two things protect it:

- The group has field-level `access.read: ({ req: { user } }) => Boolean(user)`,
  so it is stripped from every unauthenticated read including REST and GraphQL.
- Nothing under `lib/`, `components/` or `app/` reads `rentDetails` at all, so
  it has no path to the public site.

Conditional validation: a Rent/Lease listing cannot be marked `rented` until the
property has a Tenancy History entry (`collections/hooks/validateListing.ts`), the
reverse is enforced on the property (history cannot be emptied while
`isTenanted`), and `agentName` is required only when `rentalSource` is
`through-agent` — so incomplete historical inventory can still be saved.
**Tenancy history stays on the Property**: it is the unit's history, and survives
a rental listing being closed and a new one opened.

Note that rental *pricing* for a unit being advertised to rent lives on its Rent
listing (`pricing.rentAmount` / `rentPeriod`), which is public.
`rentDetails` is about an executed agreement and is not.

**`currentAgreementEndDate`** (also in the Rent Details tab, above the
Tenancy History array) is a denormalized, read-only, top-level `date` field —
the current (last) `rentHistory` entry's end date, kept in sync by its own
`beforeChange` hook every time the property is saved. It exists purely so the
property list can **sort and filter** by it (`admin.defaultColumns`), which a
`virtual` field cannot do — Payload's list view queries the database directly,
before any `afterRead` hook would compute a virtual value. Gated with the same
`access.read: Boolean(user)` as `rentHistory` — since it's a plain top-level
field rather than nested inside `rentHistory`'s own group, that gate had to be
applied explicitly; it is not inherited automatically. The list-view column
renders through `components/payload/AgreementCountdownCell.tsx` ("N days
left" / "Expired N days ago", coloured by urgency — matching the ≤60-day
window this field exists to answer) rather than a bare date.
`scripts/backfill-current-agreement-end-date.ts` is the one-time backfill for
properties that existed before this field did — a hook-computed field, unlike
one with a static `defaultValue`, is never backfilled by Postgres's own schema
push, so existing rows stayed `null` until this ran.

The same value also shows in the **sidebar**, directly under `status` — not a
second data field (a field can only live at one path), but a `type: 'ui'`
field (`agreementCountdown`) whose `AgreementCountdownSidebar` component reads
`status` and `currentAgreementEndDate` live out of the edit form, rendering
only when `status === 'rented'`. Shares its day-math and urgency tiering with
the list Cell via `lib/properties/agreementCountdown.ts`.

### CSV property import

`scripts/import-properties.ts` (`npm run import:properties -- "<csv path>"`,
dry run by default — see the script header) bulk-imports property records,
including `rentHistory`, from RER's spreadsheet-tracked inventory. **It still
writes the old single-record shape** (`purpose`, `status`, `pricing` on the
property); immediately after each property is created it creates the listing that
shape implies, through the same planner the migration uses
(`lib/listings/createFromLegacy.ts`), so an imported record cannot bypass the
listings model. The mapping table below is therefore "CSV column -> legacy
property field, copied onto the listing" for `Listing Type`, `Status`, `Asking
Price`, `Rent`, `Deposit`, `Maintenance`, `Brokerage`, `Parking Charges`. It never
invents data and never overwrites a populated field with a blank CSV value.

Column mapping (source columns not listed here have no destination field and
are reported as unmapped by the script — the CSV's `Source`, `Source Contact`,
`Photos`, `Video`, `Documents`, `Owner Permission`, `Last Verified`,
`Next Verification`, `Listing Ready`, `Website`, `Portals`, `Assigned To` and
`Remarks` columns currently fall in this category; see `DECISIONS.md` for why
`Owner Name`/`Owner Contact`/`Parking`/`Parking Charges` moved out of it):

| CSV column | Payload field | Notes |
| --- | --- | --- |
| `Property ID` | `propertyId` | Used exactly as given by default; a per-run `IMPORT_PROPERTY_ID_START` override can instead assign sequential IDs in CSV row order — see "Property ID range for the first CSV import" in `DECISIONS.md`. The first real import used this override to assign `RER-00001`–`RER-00018` (the CSV's own column said `RER-00008`–`RER-00025`); the sequence's next value after that import is `RER-00019`. |
| `Property Title` | `title` | |
| `Status` | `status` | Matched case-insensitively against the existing option values. |
| `Listing Type` | `purpose` | |
| `Category` | `propertyCategory` | |
| `Property Type` | `propertyType` | |
| `Location` | `location.locality` | The CSV's broader named suburb (e.g. "Jogeshwari West") — matches how `locality` is used elsewhere (see `scripts/seed-test-inventory.ts`), **not** the CSV's own "Locality" column. |
| `Locality` | `location.area` | The CSV's smaller pocket/complex name (e.g. "Vaishali Nagar") — the two CSV column names are the reverse of the Payload field names they map to. |
| `Flat No.` | `location.flatNo` | |
| `Building / Society` | `buildingDetails.buildingName` | |
| `Address` | `location.address` | `location.city` is set to "Mumbai" only when the address text contains it; otherwise the field's own default applies. |
| `Carpet Area` (+ unit) | `details.carpetArea` / `details.carpetAreaUnit` | Each figure has its own field — a row with both Carpet Area and Built-up Area populated writes both, no reconciliation needed. |
| `Built-up Area` (+ unit) | `details.builtUpArea` / `details.builtUpAreaUnit` | See above. |
| `BHK / Configuration` | `details.bedrooms` | Parsed from `"<N>BHK"`. |
| `Floor` / `Total Floors` | `buildingDetails.floorNumber` / `totalFloors` | |
| `Furnishing` | `details.furnishing` | `"Fully Furnished"` → `furnished`. |
| `Property Age` | `details.propertyAge` | |
| `Parking` | `details.parking` | `"None"` → `0`; a bare count (e.g. `"1"`) → that number. |
| `Asking Price` | `pricing.price` | |
| `Rent` | `pricing.rentAmount` **and** `rentHistory[].monthlyRent` | Same figure, two legitimate destinations — advertised/reference rent vs. the specific tenancy's contracted rent. |
| `Parking Charges` | `pricing.parkingCharges` | Kept separate from `price`/`rentAmount` — never folded into the property's price or rent. |
| `Owner Name` | `ownerDetails.ownerName` | |
| `Owner Contact` | `ownerDetails.ownerContact` | |
| `Deposit` | `pricing.securityDeposit` **and** `rentHistory[].securityDeposit` | Same reasoning as `Rent`. |
| `Maintenance` | `pricing.maintenanceCharges` | |
| `Brokerage` | `pricing.brokerageFee` | |
| `Licensee Name` / `Licensee Contact Number` | `rentHistory[].licenseeName` / `licenseeContactNumber` | |
| `Agreement Term` | `rentHistory[].agreementTermMonths` | Not the free-text `agreementTerm` field — the CSV's term is already a clean number of months. |
| `Agreement Start Date` | `rentHistory[].agreementStartDate` | |
| *(no CSV column)* | `rentHistory[].agreementTermDays` | Optional extra days entered in the admin form (whole, ≥ 0). The import never writes it; blank/absent counts as 0, so imported and pre-existing rows calculate exactly as before. |
| `Agreement End Date` | **not written** | Compared against the value `calculateAgreementEndDate()` produces — the last calendar day of the term (Start Date + Term − 1 day) — and reported as MATCH/DISCREPANCY; the calculated value is what Payload's own field hook stores. See `DECISIONS.md`. |

## Listings

`listings` (`collections/Listings.ts`, admin group *Listings*, `disableDuplicate`).
One **transaction** — a sale, a rental or a lease — offered on a Property. A
property has any number of listings; each is managed independently. Property = the
unit and everything true of it whatever it is offered as; Listing = everything
that can differ between two ways of offering it.

| Field | Type | Notes |
| --- | --- | --- |
| `listingId` | text, unique, read-only | `RER-L-00001`, from Postgres sequence `rer_listing_id_seq` (`collections/hooks/assignListingId.ts`). Never rewritten. A third permanent series beside `RER-00001` (property) and `RER-P-0001` (project) |
| `property` | relationship → `properties`, required, indexed | Immutable: a save that changes it is rejected. FK is `ON DELETE SET NULL` on a NOT NULL column, so a property that still has listings cannot be deleted at all (also refused up front by `protectPropertyWithListings`) |
| `transactionType` | select, required, indexed | `sale` / `rent` / `lease`. Lease is kept because the pricing fields for it already existed; no Leave & Licence workflow was added |
| `status` | select, required, indexed, default `draft` | `draft`, `available`, `under-offer`, `sold`, `rented`, `withdrawn` (new; non-public, closed, lets a listing be taken down without deleting it) |
| `slug` | text, unique, required | The public URL. First listing of a property = the property's own slug (existing URLs keep working); later ones `<property-slug>-<sale\|rent\|lease>[-n]` (`lib/listings/slug.ts`). Never rewritten |
| `tags` | multi-select | Listing-level marketing tags only: `featured`, `new`, `premium`, `price-reduced` |
| `pricing` | group | Same shape the property's pricing group had: `currency`, `price`, `priceOnRequest`, `negotiable`, `pricePerSqFt`, `additionalCharges`, `rentAmount`, `rentPeriod`, `securityDeposit`, `maintenanceCharges`, `maintenanceIncluded`, `brokerageFee`, `totalLeaseAmount`, `monthlyLeasePayment`, `parkingCharges`. Fields show per transaction type; all `min: 0` |
| `assignedAgent` | relationship → `users`, staff-only read | Internal tab |
| `internalNotes` | textarea, staff-only read | Internal tab |

**What lives where.** On the Property: identity (`propertyId`, slug, title,
category, type), location, nearby connectivity, `details`, `buildingDetails`,
amenities, media, description, owner details, **tenancy history**
(`rentHistory`, `currentAgreementEndDate`). On the Listing: transaction type,
status, price and every transaction-specific term, URL, marketing tags, agent,
notes. Nothing is duplicated between them; the public site reads the property's
facts through the listing's `property` relationship.

**Not built, because nothing in the repo supports it:** portal publishing
settings and per-listing enquiry/negotiation records (no portal integration and
no enquiry-to-property link exist; `contact-inquiries` is a free-standing form
log), and any Lease / Leave & Licence workflow beyond the existing lease price
fields.

### Rules enforced on the server (not the form)

`collections/hooks/validateListing.ts` (+ `lib/listings/rules.ts`), as a
collection `beforeChange` hook, so the admin, REST, GraphQL, Local API and every
script go through the same checks. Failures are `ValidationError`s attached to
the offending field.

- the parent property exists and is readable by the caller;
- a listing is never moved to another property;
- status fits the type: a Sale cannot be `rented`; a Rent/Lease cannot be `sold`;
- a live listing (`available` / `under-offer`) has an amount for its type
  (sale: `price`; rent: `rentAmount`; lease: a lease amount) or `priceOnRequest`;
  drafts and closed listings may be incomplete;
- a Rent/Lease listing cannot be `rented` until the property has a Tenancy
  History entry;
- **at most one *active* (draft / available / under-offer) listing per
  transaction type per property.** Sold, rented and withdrawn listings are
  history and never collide, so a rental can be re-listed after a tenancy.
  Enforced three ways: the hook (with a message naming the existing listing), a
  per-property **transaction advisory lock** (`collections/hooks/listingLock.ts`,
  first `beforeChange` hook) that makes concurrent saves for one property run one
  after the other so the hook sees the winner, and a **partial unique index**
  `listings_one_active_per_type_idx` on `(property_id, transaction_type) WHERE
  status IN ('draft','available','under-offer')`
  (`collections/hooks/listingIndexSchema.ts`, declared via `afterSchemaInit` so the
  push owns it). The index is the guarantee even for writes that bypass hooks;
  its violation is reported on Transaction type and explained by the
  `afterError` hook (`listingErrors.ts`).

### Creating a property with its first listing

The property create form has a **create-only, virtual** group `initialListing`
("First listing (optional)": Sale or Rent, status Draft/Available, price or rent,
deposit, maintenance, price on request, negotiable). It is never stored —
`virtual: true`, no column; `admin.readOnly: false` because Payload renders
virtual fields read-only by default. `collections/hooks/initialListing.ts`:

- `validateInitialListing` (`beforeValidate`, create only) runs the same listing
  rules before anything is written or a Property ID is allocated; errors land on
  `initialListing.<field>`;
- `createInitialListing` (`afterChange`, create only, last) creates the listing
  through the Listings collection with the same `req`, i.e. inside the property's
  transaction. If it fails, Payload rolls back the property and its media folder.

Lease and second listings are added from the Listings tab.

### Roll-up and independence

Saving or deleting a listing recomputes its property's `status` and `isTenanted`
(`syncPropertyRollup`, same transaction) and writes **only the property**. Closing
the rental therefore cannot change the sale listing — nothing ever writes a
sibling.

### Access

Same model as every other collection: authenticated staff create / update /
delete; anonymous `read` is `status in available/under-offer`; `assignedAgent` and
`internalNotes` are stripped for visitors. A property with any listings (including
sold, rented and withdrawn ones) cannot be deleted (HTTP 409 from
`protectPropertyWithListings`).

## Projects

A **separate concept from Properties** — a development, not a unit. Separate
collection, separate status vocabulary, separate data layer, separate routes.
Neither the rental architecture nor Channel Partners applies to Projects:
Projects have no `rented` status, no `rentDetails`, and no relationship to
`channel-partners`.

- Sidebar: `projectId` (sequence `rer_project_id_seq`, declared in `collections/hooks/idSequenceSchema.ts` so the dev schema push cannot drop it), `mediaFolder`,
  `mediaFolderLink`, `status` (`draft`, `upcoming`, `under-construction`,
  `ready-to-move`, `completed`, `sold-out`).
- Overview: `name`, `slug`, `developer`, `isNew` (drives the homepage "new
  launches" query), `highlightTags`, `description`, `highlights[]`.
- `location` and `nearbyConnectivity` — same shape as Properties.
- `configurations[]` — per-unit-type name, carpet/min/max area + unit, starting
  and max price, price label, availability, notes. This is where a project
  carries ranges rather than one price.
- `projectDetails` — `projectType` (residential / commercial / mixed-use),
  `propertyType`, `possessionStatus`, `possessionDate`, `constructionStatus`,
  `numberOfTowers`, `numberOfFloors`, `totalUnits`, `parkingInfo`,
  `developerDescription`.
- `specifications[]` — label/value pairs.
- `amenities` — same shared `amenities` relationship as Properties.
- `media` — `featuredImage`, `gallery`, `floorPlans`, `masterPlan`,
  `locationMapImage` (Properties has only the first two).

Public = any status except `draft`.

## Channel Partners

RER's internal developer inventory, and the source of the **Official Channel
Partners** section on the homepage. Five fields, deliberately flat — this is a
logo list, not a partner CRM.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | text, required | Used for the logo alt text and the link label |
| `logo` | upload → `media`, optional | SVG preferred, else high-resolution PNG/WebP |
| `websiteUrl` | text, optional | Validated as `http:`/`https:` on save |
| `displayOrder` | number, default 0 | Lower first; ties fall back to `name` |
| `active` | checkbox, default `true` | Labelled **Show on Website** in the admin |

Access: public `read`, authenticated `create` / `update` / `delete`. Consumed
only by `lib/channel-partners/` and
`components/home/OfficialChannelPartners.jsx`.

**The collection holds more developers than the website shows.** A record can
exist purely for internal reference; `active` is the publish switch, and
flipping it in the admin adds or removes that developer from the carousel with
no code change. Developers are never deleted just because they are not
currently displayed — the inventory is meant to grow ahead of the public list.

`logo` is optional for that reason: an internal-only record may have no usable
official logo yet. Note the consequence — `mapChannelPartner()` drops any
partner whose logo is missing, so ticking Show on Website has no visible effect
until a logo is uploaded.

Seeded and re-seeded by `scripts/seed-channel-partners.ts`, which matches on
`name`, updates in place (ids preserved) and never deletes.

## Website Banners

`website-banners` (`collections/WebsiteBanners.ts`). Photography and copy for
the homepage hero, the homepage Our Story image and the four page headers.
**Drafts enabled** (`versions.drafts`, `maxPerDoc: 25`).

| Field | Type | Notes |
| --- | --- | --- |
| `name` | text, required | Internal label |
| `placement` | select, required, **unique** | `home`, `our-story`, `properties`, `rentals`, `commercial`, `projects`, `about`, `contact`. Locked once set (field `update` access). Stored values — never rename |
| `desktopImage` / `mobileImage` | upload → `media` | SVG excluded. Desktop required to publish `home` and `our-story`. FK `ON DELETE SET NULL` |
| `imageAlt` | text | `our-story` only; falls back to the Media `alt` |
| `desktopPosition` / `mobilePosition` | select | Nine object-positions; mobile blank = desktop |
| `eyebrow`, `heading`, `headingAccent`, `description` | text / textarea | `hero` and `page` kinds; heading required to publish |
| `showCta`, `ctaLabel`, `ctaUrl` | checkbox / text | URL limited to site paths, http(s), `tel:`, `mailto:` (`lib/website-banners/links.ts`) |
| `overlay` | select | `light` / `standard` / `strong` |
| `textAlign` | select | `left` / `center`, `page` kind only |
| `enabled` | checkbox, default `true` | **Show on Website**; applies when published |
| `internalNotes` | textarea | Field-level read: signed-in only |

Access: authenticated `create` / `update` / `delete` / `readVersions`; `read`
is everything for staff and `_status = published AND enabled = true` for
everyone else. `disableDuplicate`. A `beforeChange` hook requires a placement
even on draft saves; `afterChange`/`afterDelete` revalidate the placement's
page. Seeded (create-only, drafts) by `scripts/seed-website-banners.ts`.

## Amenities

Master list shared by Properties and Projects: `name` (unique), `slug`
(unique), `category` (`building` / `lifestyle` / `convenience`). Public `read`
— without it the relationship silently failed to populate for visitors. Seeded
on boot by `collections/hooks/ensureDefaultAmenities.ts`, which only ever
creates, never updates or deletes.

## Media

See the media section of `ARCHITECTURE.md`. Fields are `alt` (required) and
`caption`; `folders: true`; uploads restricted to `image/*`.

## Contact Inquiries

Written by `app/api/contact/route.ts`: `name`, `phone`, `email`,
`requirement`, `message`, `source`, `status`, `notes`. Not read by the public
site.
