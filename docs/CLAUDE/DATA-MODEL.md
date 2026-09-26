# Data model

Collections live in `collections/` and are registered in `payload.config.ts`.
Generated types are in `payload-types.ts` (`npx payload generate:types`).

| Collection | Slug | Admin group | Purpose |
| --- | --- | --- | --- |
| Users | `users` | Admin | Auth for RER staff |
| Properties | `properties` | Listings | Individual units RER transacts on |
| Projects | `projects` | Listings | Developments |
| Amenities | `amenities` | Reference Data | Shared amenity master list |
| Channel Partners | `channel-partners` | Reference Data | RER developer inventory; drives the homepage partner strip |
| Media | `media` | Media Library | Every uploaded image |
| Contact Inquiries | `contact-inquiries` | Leads | Contact-form submissions |

## Properties

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
  `sold`, `rented`. Rendered with the custom `StatusBadge` cell. **This field
  alone decides public visibility** (see below).

**Overview tab** — `title`, `slug`, `purpose` (`sale` / `rent` / `lease`),
`propertyCategory` (`residential` / `commercial`), `propertyType` (apartment,
house, villa, office, shop, showroom, warehouse, land, other), `tags`
(multi-select: `new`, `featured`, `new-development`, `under-construction`,
`ready-to-move`, `premium`, `price-reduced`, `commercial`, `residential`),
`description` (Lexical rich text).

`slug` is generated on create only and is the public URL. The **Slug Update**
button beside the field (`components/payload/RegenerateSlugButton.tsx`) rebuilds
it from the current BHK, property type, locality and RER ID — the way to fix a
duplicate's inherited slug, or one left stale by a later correction.

**Location tab** — `location` group (`locality` and `city` required; `area`,
`state`, `address`, `latitude`, `longitude` optional) and `nearbyConnectivity`
with a `connections` array (place `name`, `category`, `travelTimeMinutes`,
`distance` + `distanceUnit`, `displayOnWebsite`). Lat/long feed the
generate-nearby-locations endpoint; they are not required to save.

**Transaction & Pricing tab** — one `pricing` group covering all three
purposes: `currency` (INR), `price`, `priceOnRequest`, `negotiable`,
`pricePerSqFt`, `additionalCharges`, `rentAmount`, `rentPeriod`,
`securityDeposit`, `maintenanceCharges`, `maintenanceIncluded`, `brokerageFee`,
`totalLeaseAmount`, `monthlyLeasePayment`, `parkingCharges`. Because the amount
lives in a different field per purpose, budget filtering picks the field from
the purpose (see `ARCHITECTURE.md`). `parkingCharges` is unconditional
(no purpose gate) — a parking charge can be a one-off (sale) or recurring
(rent/lease) cost and is always separate from the price/rent fields above.

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

- Public = `status` in `['available', 'under-offer']`. Enforced twice: the
  collection's `read` access returns that `where` constraint for unauthenticated
  requests, and every public query in `lib/properties/` also applies
  `publicStatusWhere()` with `overrideAccess: false`.
- Featured = public **and** `tags` contains `featured` (`publicFeaturedWhere()`).
  There is no separate boolean field.

### Rental architecture (implemented)

`Property Status = Rented` means the property is **retained in Payload but
excluded from public inventory**. `rented` is not in `PUBLIC_STATUSES`, so the
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

Conditional validation: `licenseeName` is required only once `status` is
`rented`, and `agentName` only when `rentalSource` is `through-agent` — so
incomplete historical inventory can still be saved.

Note that rental *pricing* for a property being advertised to rent lives in
`pricing.rentAmount` / `rentPeriod` (purpose = `rent`), which is public.
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
including `rentHistory`, from RER's spreadsheet-tracked inventory. It never
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
| `Agreement End Date` | **not written** | Compared against the value `calculateAgreementEndDate()` produces — the last calendar day of the term (Start Date + Term − 1 day) — and reported as MATCH/DISCREPANCY; the calculated value is what Payload's own field hook stores. See `DECISIONS.md`. |

## Projects

A **separate concept from Properties** — a development, not a unit. Separate
collection, separate status vocabulary, separate data layer, separate routes.
Neither the rental architecture nor Channel Partners applies to Projects:
Projects have no `rented` status, no `rentDetails`, and no relationship to
`channel-partners`.

- Sidebar: `projectId` (sequence `rer_project_id_seq`), `mediaFolder`,
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
