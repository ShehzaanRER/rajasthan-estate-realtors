-- Listings rollout — POST-MIGRATION checks. READ-ONLY.
-- Run after scripts/migrate-property-listings.ts has applied, together with
-- docs/listings-verify-baseline.sql. Expected results are in the comments.
--
--   psql "$PROD_DIRECT_URL" -X -A -F ' | ' -f docs/listings-verify-after.sql > after-listings.txt
SET default_transaction_read_only = on;

-- 1. Totals. listings = properties (one migrated listing each), unless the
--    migration report listed properties it could not migrate.
SELECT (SELECT count(*) FROM properties) AS properties, (SELECT count(*) FROM listings) AS listings;

-- 2. Properties with NO listing. Expect zero rows — or exactly the properties the
--    migration report marked "NOT MIGRATED", with the reason it gave.
SELECT p.property_id, p.purpose, p.status
FROM properties p LEFT JOIN listings l ON l.property_id = p.id
WHERE l.id IS NULL ORDER BY p.property_id;

-- 3. Every migrated listing kept its property's URL and transaction. Expect zero rows.
SELECT p.property_id, p.slug AS property_slug, l.slug AS listing_slug, p.purpose, l.transaction_type
FROM properties p JOIN listings l ON l.property_id = p.id
WHERE l.slug <> p.slug OR l.transaction_type::text <> p.purpose::text;

-- 4. Legacy price/terms copied exactly. Expect zero rows.
SELECT p.property_id
FROM properties p JOIN listings l ON l.property_id = p.id AND l.transaction_type::text = p.purpose::text
WHERE (p.pricing_price, p.pricing_rent_amount, p.pricing_security_deposit, p.pricing_maintenance_charges,
       p.pricing_brokerage_fee, p.pricing_parking_charges, p.pricing_monthly_lease_payment,
       p.pricing_total_lease_amount, p.pricing_price_on_request, p.pricing_negotiable)
  IS DISTINCT FROM
      (l.pricing_price, l.pricing_rent_amount, l.pricing_security_deposit, l.pricing_maintenance_charges,
       l.pricing_brokerage_fee, l.pricing_parking_charges, l.pricing_monthly_lease_payment,
       l.pricing_total_lease_amount, l.pricing_price_on_request, l.pricing_negotiable);

-- 5. Status copied. Expect zero rows, except properties flagged "incompatible-status"
--    (their listing is Draft by design).
SELECT p.property_id, p.status AS property_status, l.status AS listing_status
FROM properties p JOIN listings l ON l.property_id = p.id
WHERE l.status::text <> p.status::text;

-- 6. Tenancy flag. tenanted must equal the number of properties that were
--    "rent/rented" or "lease/rented" in the baseline (query 4 there).
SELECT count(*) FILTER (WHERE is_tenanted) AS tenanted, count(*) FILTER (WHERE status = 'rented') AS rented FROM properties;

-- 7. Never more than one ACTIVE listing per type per property. Expect zero rows
--    (the partial unique index makes this impossible; this proves it exists and works).
SELECT property_id, transaction_type, count(*)
FROM listings WHERE status IN ('draft', 'available', 'under-offer')
GROUP BY property_id, transaction_type HAVING count(*) > 1;

-- 8. The race-proof index exists, with exactly this definition.
SELECT indexname, indexdef FROM pg_indexes WHERE indexname = 'listings_one_active_per_type_idx';

-- 9. Listing ID sequence: last_value must equal the highest numeric Listing ID.
SELECT (SELECT last_value FROM rer_listing_id_seq) AS sequence_value,
       (SELECT max(substring(listing_id FROM 'RER-L-(\d+)')::int) FROM listings) AS highest_listing_id;

-- 10. Listing counts by type and status (the console's Listings panel must match).
SELECT transaction_type, status, count(*) FROM listings GROUP BY 1, 2 ORDER BY 1, 2;
