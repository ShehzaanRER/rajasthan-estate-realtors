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

**Location tab** — `location` group (`locality` and `city` required; `area`,
`state`, `address`, `latitude`, `longitude` optional) and `nearbyConnectivity`
with a `connections` array (place `name`, `category`, `travelTimeMinutes`,
`distance` + `distanceUnit`, `displayOnWebsite`). Lat/long feed the
generate-nearby-locations endpoint; they are not required to save.

**Transaction & Pricing tab** — one `pricing` group covering all three
purposes: `currency` (INR), `price`, `priceOnRequest`, `negotiable`,
`pricePerSqFt`, `additionalCharges`, `rentAmount`, `rentPeriod`,
`securityDeposit`, `maintenanceCharges`, `maintenanceIncluded`, `brokerageFee`,
`totalLeaseAmount`, `monthlyLeasePayment`. Because the amount lives in a
different field per purpose, budget filtering picks the field from the purpose
(see `ARCHITECTURE.md`).

**Property Details tab** — `details` group (`bedrooms`, `bathrooms`, `area` +
`areaUnit`, `furnishing`, `balconies`, `propertyAge`, `possessionStatus`, and
the commercial-only `cabins`, `workstations`, `meetingRooms`,
`pantryAvailable`, `fitOutStatus`) and `buildingDetails` (`buildingName`,
`totalFloors`, `floorNumber`, `liftAvailable`).

**Amenities tab** — `amenities`, a has-many relationship to the `amenities`
collection. Amenities are never duplicated onto a listing.

**Media tab** — `media` group with `featuredImage` (single upload) and
`gallery` (has-many upload), both to `media`, both optional.

**Rent Details tab** — internal rental record, described next.

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
