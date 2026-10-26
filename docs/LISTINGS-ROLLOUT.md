# Rolling out Listings (one property, many listings)

Production procedure for the listings change. What the model is and why:
`docs/CLAUDE/DATA-MODEL.md` › Listings and `docs/CLAUDE/DECISIONS.md`.

> **Status (2026-10-24): nothing in this document has been run against
> production.** The live Supabase database has no `listings` table, no new column,
> and no listing. Every step below was rehearsed on scratch PostgreSQL 17
> databases built from the pre-change code (commit `f1df8a6`) with fictional data.
> A read-only inspection of production is not approval to change it.
>
> **Rollout paused at step 2 (2026-10-25).** Step 1 was done read-only: the
> production schema plan matched `docs/listings-schema.sql` exactly, plus the two
> known drift lines, with no data loss. The backup was not taken: the old laptop
> had no PostgreSQL client tools (`pg_dump`). **Resume at §2 on a machine with
> PostgreSQL 17 client tools, and re-run the §4 preview first** in case production
> changed meanwhile. Also still open: confirm no other machine runs pre-listings
> code with `next dev` against production (§1).

## 0. Why this needs care

- **Dev and production share one database.** `.env` points at it. Until this
  branch, `next dev` and `payload run` applied the current branch's schema to it
  automatically (Payload's dev push).
- **A property is visible only through a listing.** New code deployed against an
  unmigrated database shows **no properties**. Order matters.
- **Old checkouts are now dangerous.** Once the listings schema exists, any
  pre-listings checkout that runs `next dev` against the live database will have
  Payload propose `DROP TABLE listings`, `DROP COLUMN is_tenanted`, and so on.
  Verified on scratch: `hasDataLoss: true`, *"You're about to delete listings table
  with N items"*. Payload asks for confirmation. **One "yes" deletes every listing.**
  The guard in §1 exists only in the new code, so old checkouts are not protected.

## 1. Safeguards built into this branch

| Safeguard | Where | Effect |
| --- | --- | --- |
| **No dev schema push to a non-local database** | `payload.config.ts` + `lib/databaseSafety.ts` | `next dev` / `payload run` push the schema only to `localhost`/`127.0.0.1`. Against the live database they start without pushing and log `[RER] Payload dev schema push is OFF`. Override only with `RER_ALLOW_LIVE_SCHEMA_PUSH=true` (the literal string). |
| **Write scripts need the target host typed out** | `scripts/migrate-property-listings.ts` | `LISTING_MIGRATE_APPLY=1` against a non-local database refuses to run unless `RER_CONFIRM_DATABASE_HOST` equals the host in `DATABASE_URL`. |
| **Schema preview is read-only by construction** | `scripts/preview-schema-push.ts` | Refuses to run without `PAYLOAD_MIGRATING=true`; skips `onInit`; never calls `apply()`. |
| **Real-database tests refuse remote databases** | `tests/listings.integration.test.ts` | Only a local database whose name contains `test`. `npm test` without `RER_LISTINGS_TEST_DATABASE_URL` never connects anywhere. |
| **Database-level duplicate guard** | `listings_one_active_per_type_idx` | At most one active listing per type per property, even under races. |

Operational rules (these are not enforced in code):

- **Never** put `RER_ALLOW_LIVE_SCHEMA_PUSH` in `.env`. Set it on one command line,
  for one reviewed step, if you use option B in §4.
- **Before the schema change, update every machine to this branch,** or stop
  running `next dev` there. That means every laptop, every branch, and every
  Railway preview or other environment that reads the same `DATABASE_URL`.
  Afterwards, any old checkout must not run `next dev` against the live database.
  (Between updating and §4, the new code's dev server against the live database
  logs errors on listing pages because the tables do not exist yet. That is
  expected and harmless: with the push off, it cannot create them.)
- Better long-term: give development its own database (a local PostgreSQL or a
  second Supabase project) and keep the production URL out of laptop `.env`
  files. This branch does not change that.

## 2. Backup and verified restore

Take this backup immediately before step 4. Don't rely on Supabase's automatic
backups alone: check the project's plan first (Dashboard → Database → Backups). On
the free tier, retention is short and restore is not self-service.

Prerequisite: PostgreSQL 17 client tools (`pg_dump`, `pg_restore`, `psql`) to
match the server (17.6). Use the **direct or session-pooler** connection string
(port 5432), not the transaction pooler.

```bash
pg_dump "$PROD_DIRECT_URL" --format=custom --no-owner --no-privileges --file rer-pre-listings-$(date +%Y%m%d-%H%M).dump
```

**Verify that the backup restores.** A backup that has never been restored is not
verified.

1. `pg_restore --list rer-pre-listings-*.dump | head` — the archive is readable.
2. Restore into a scratch database (local PostgreSQL 17, or a throw-away Supabase
   project), **never into production**:

   ```bash
   createdb rer_restore_check
   ```

   ```bash
   pg_restore --no-owner --no-privileges --dbname rer_restore_check rer-pre-listings-*.dump
   ```
3. Run `docs/listings-verify-baseline.sql` against production and against
   `rer_restore_check`. The outputs must be identical: counts, sequences and
   fingerprints. Only then does the backup count as verified.
4. Store the dump encrypted and outside the repository (`.gitignore` blocks
   `*.dump`). It contains owner and tenant names and phone numbers and password
   hashes. Delete it under RER's own retention policy.

**Restore procedure (last resort, §7 level D):** stop the app, then restore into a
**new** Supabase project, verify it with the baseline SQL, and repoint
`DATABASE_URL`. Don't `pg_restore --clean` over the live database. Everything
written after the dump is lost.

*Not done in development:* this machine has no PostgreSQL client tools, so these
commands were reviewed but not executed here. Run steps 1–3 at rollout.

## 3. Capture the baseline (read-only)

```bash
psql "$PROD_DIRECT_URL" -X -A -F ' | ' -f docs/listings-verify-baseline.sql > before.txt
```

Keep `before.txt`. It holds counts, sequences, and fingerprints of every legacy
pricing, owner, media and tenancy column, plus the list of every currently public
URL.

## 4. Schema change

### Review first (read-only)

```bash
PAYLOAD_MIGRATING=true RER_SCHEMA_SQL_OUT=prod-plan.sql npx payload run scripts/preview-schema-push.ts
```

Compare `prod-plan.sql` with **`docs/listings-schema.sql`** (the reviewed plan).
They must match, apart from two lines the push emits on every boot for unrelated
pre-existing drift: `channel_partners.display_order SET DEFAULT 0` and
`users.login_attempts SET DEFAULT 0`. Expect `hasDataLoss: false`, no warnings,
and the line *"No DROP TABLE / COLUMN / SEQUENCE / TYPE / INDEX / CONSTRAINT or
TRUNCATE"*. **Anything else: stop.**

The reviewed plan contains 28 statements:

- five `CREATE TYPE` and `CREATE SEQUENCE rer_listing_id_seq`;
- `CREATE TABLE listings` and `listings_tags`;
- three foreign keys and twelve indexes, including the partial unique
  `listings_one_active_per_type_idx … WHERE status IN (draft, available,
  under-offer)`;
- two new nullable columns, `properties.is_tenanted` and
  `payload_locked_documents_rels.listings_id`, with their key and index;
- **one relaxation:** `ALTER TABLE properties ALTER COLUMN purpose DROP NOT NULL`.

Nothing is dropped, renamed or rewritten.

### Apply: option A (recommended), the reviewed SQL in one transaction

```bash
psql "$PROD_DIRECT_URL" -v ON_ERROR_STOP=1 -f docs/listings-schema.sql
```

It applies everything or nothing. Afterwards, the preview command above must
report only the two drift statements. Rehearsed: applying the file to a
pre-change copy left exactly those two, and the migration then ran cleanly.

### Apply: option B, the project's usual dev push, deliberately enabled once

```bash
RER_ALLOW_LIVE_SCHEMA_PUSH=true npm run dev
```

Open `/admin` once, then stop the server. This also applies the two drift
statements. It touches nothing else.

Either way, the deployed (old) site keeps working: it never reads the new tables.

## 5. Data migration

```bash
npx payload run scripts/migrate-property-listings.ts
```

That is the dry run. Read every line:

- each `ERROR` names a property and why it was left untouched;
- each `warning` names something carried across that you should review.

```bash
LISTING_MIGRATE_APPLY=1 RER_CONFIRM_DATABASE_HOST=<host from DATABASE_URL> npx payload run scripts/migrate-property-listings.ts
```

What a successful apply prints:

- one `RER-0000x -> RER-L-0000x` per property, in Property ID order;
- `rer_property_id_seq: N -> N (must be unchanged)`;
- `Every property now has at least one listing`, or the exact list of properties
  it refused.

The exit code is non-zero on any failure. Re-running is safe: properties that
already have a listing of that type are skipped. A half-finished run is completed
by running the command again.

What the migration does: for each property it creates **one** listing, copying:

- `purpose` → transaction type, and `status`;
- all 15 pricing columns, verbatim;
- the marketing tags (featured, new, premium, price-reduced);
- the slug, so every URL is unchanged.

It writes `status` and `is_tenanted` back onto the property through the roll-up.
Nothing on the property is removed or changed. The only exception: a property with
an impossible combination (e.g. a Sale marked Rented) gets a Draft listing, so its
summary status becomes Draft. The report says so.

Rehearsed on fictional legacy data that included every awkward case:

- a mixed-case legacy slug;
- a rental that only had a sale price;
- a Sale marked Rented;
- a negative rent;
- a lease;
- price-on-request.

It created 10 listings and refused the negative rent with its reason. Every
pricing column matched. Tenancy history, tags, media links and folders were
byte-identical before and after, and the property sequence did not move. A second
run created nothing.

## 6. Verification

```bash
psql "$PROD_DIRECT_URL" -X -A -F ' | ' -f docs/listings-verify-baseline.sql > after.txt
```

```bash
diff before.txt after.txt
```

The diff must be empty. Two documented exceptions:

- query 4 may differ for properties the report flagged `incompatible-status`;
- `updated_at` is not compared.

```bash
psql "$PROD_DIRECT_URL" -X -A -F ' | ' -f docs/listings-verify-after.sql
```

Each query states its expected result. In short:

- listings = properties;
- no property without a listing (except reported refusals);
- slug, type, status and every price identical to the legacy columns;
- `tenanted` = the baseline count of rented rent/lease properties;
- no duplicate active listing, and the partial index present;
- the listing sequence equal to the highest Listing ID.

**Admin check:**

- Console: the Properties total is unchanged, and the Listings total equals it.
- The Agreement renewals panel still lists every tenancy, with the same count as
  before.
- One property: its Listings tab and sidebar show its listing.

**URL check, after deploy:** save the slugs from query 6 of `before.txt` as
`public-slugs.txt`, one per line, then request each:

```bash
while read slug; do printf '%s ' "$slug"; curl -s -o /dev/null -w '%{http_code}\n' "https://rajasthanestaterealtors.in/properties/$slug"; done < public-slugs.txt
```

Every line must be `200`. Also check `/sitemap.xml`, which lists the same slugs.

## 7. Deployment order, rollback and recovery

1. Code reviewed; **all machines on this branch** (§1).
2. Backup taken and **restore-verified** (§2); baseline captured (§3).
3. Schema applied (§4); preview shows only the drift.
4. Migration dry run reviewed, then applied (§5).
5. Verification queries and admin check (§6).
6. **Deploy** the new code (Railway). Then the URL check and `/sitemap.xml`. The
   homepage is prerendered, so its featured properties refresh with this deploy.

The old code keeps working through steps 3–5, so the site stays up and correct
until step 6.

| Level | When | How | Data impact |
| --- | --- | --- | --- |
| **A. Code rollback** | anything wrong after step 6 | Redeploy the previous build | None. The old code ignores the new tables and still reads the legacy columns, which were never changed. **Preferred.** |
| **B. Fix data in place** | a listing is wrong | Edit it in the admin, or fix and re-run the migration (idempotent) | None beyond the fix |
| **C. Schema undo** | the schema itself must go | Old code deployed first, then `psql -v ON_ERROR_STOP=1 -f docs/listings-schema-undo.sql` | **Deletes all listings.** Rehearsed: afterwards, the old code's push sees no listings-related difference. Read the file header first |
| **D. Restore backup** | data damaged beyond repair | §2 restore procedure | Loses everything written since the dump |

## 8. Working with listings after rollout

- **Create a property and its first listing in one save.** On the property's
  Overview tab, fill *First listing (optional)*: Sale or Rent, status, price or
  rent and deposit.
  - If the listing is invalid (e.g. live with no price), nothing is saved and no
    Property ID is used. The message appears on the field.
  - If the listing fails after validation, the whole save rolls back: no property,
    no media folder.
  - Leave the section empty to add listings later.
- **Add the second listing** from the property's **Listings** tab → *Add new*. The
  property is pre-selected, and nothing shared is re-entered.
- **Property ID vs Listing ID.** `RER-00001` is the unit and never changes.
  `RER-L-00001` is one transaction on it. Listing IDs can have gaps: a refused save
  still consumes one, the same as property IDs.
- **Each listing is independent.** Edit its price, publish it (Available),
  unpublish it (Draft / Withdrawn), mark it Sold / Rented. Closing one never
  touches another. A rental needs a Tenancy History entry on the property before
  it can be marked Rented.
- **One active listing per type.** Draft, Available and Under offer count as
  active. To re-list a flat, close the old listing (Rented / Sold / Withdrawn) and
  add a new one. The old one stays as history, at its own URL, which returns 404
  while closed.
- **A property with listings cannot be deleted,** even if they are all withdrawn,
  because they are its history.
- The property's own **Status** is a read-only summary.

## 9. AppSheet / Google Sheets intake — NOT updated, needs your action

**Nothing in this repository talks to AppSheet or Google Sheets.** No AppSheet
configuration, credentials, webhook URLs or sheet schema were available, so that
workflow **has not been changed, and it is unknown whether it works with the new
model.**

What the repo does contain is the CSV path, `scripts/import-properties.ts`
(`npm run import:properties`), which reads a CSV exported from the spreadsheet. It
has been updated: after it creates a property, it creates the implied listing. A
CSV import no longer produces invisible properties.

If the AppSheet / Sheets workflow writes into Payload some other way, it must
change as follows, or it will create properties that never appear on the site:

| It currently does | It must now do |
| --- | --- |
| Creates one property row with Listing Type, Status, Asking Price / Rent, Deposit, Maintenance, Brokerage, Parking Charges | Create the **property** with the physical columns only (title, category, type, location, flat no., building, areas, BHK, floor, furnishing, age, parking count, owner, tenancy). Then create **one listing per transaction** with the transaction columns. Alternatively, send the first listing inside the property create as `initialListing: { transactionType, status, price \| rentAmount, securityDeposit, maintenanceCharges, priceOnRequest, negotiable }` |
| Writes `purpose` / `status` / `pricing.*` on `/api/properties` | Stop. `purpose` and `pricing` are legacy, and the site ignores them. `status` is read-only, and changes are dropped. Write them on **`POST /api/listings`** |
| Treats a row as sale **or** rent | Model a dual-listed flat as **one property row + two listing rows**. Never create the flat twice |
| Updates the price on the property | `PATCH /api/listings/<id>` on that transaction's listing |
| Reads back the Property ID (`RER-00001`) as the row key | Keep it as the **property** key; add a **Listing ID** column (`RER-L-00001`) for listing rows, returned by the create call |

A listing create needs `{ property: <numeric property id>, transactionType:
"sale" | "rent" | "lease", status, pricing: { ... } }`.

- `listingId` and `slug` are generated.
- A live listing needs an amount or `priceOnRequest`.
- A second active listing of the same type is refused with a 400 that names the
  existing `RER-L-…`.
- Writing **directly into Postgres** bypasses every rule, the roll-up and the ID
  sequence. Use the API.

## 10. Verification commands (development)

```bash
npx tsc --noEmit -p .
```

```bash
npm run lint
```

```bash
npm test
```

`npm test` runs no database tests unless `RER_LISTINGS_TEST_DATABASE_URL` is set.

```bash
RER_LISTINGS_TEST_DATABASE_URL=postgresql://user:pw@127.0.0.1:5432/rer_itest npm test
```

That is the real-PostgreSQL suite: local only, and the database name must contain
`test`.

```bash
DATABASE_URL=postgresql://user:pw@127.0.0.1:5432/rer_build_test npm run build
```

Build against a **local, migrated** database. The production build reads the
database to prerender `/`.
