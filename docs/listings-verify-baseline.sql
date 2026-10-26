-- Listings rollout — BASELINE fingerprint. READ-ONLY.
--
-- Run BEFORE the schema change and save the output; run again AFTER the
-- migration. Every row must be identical, except where a comment says the value
-- is expected to change. See docs/LISTINGS-ROLLOUT.md › Verification.
--
--   psql "$PROD_DIRECT_URL" -X -A -F ' | ' -f docs/listings-verify-baseline.sql > before.txt
SET default_transaction_read_only = on;

-- 1. Counts. None of these may change.
SELECT 'properties' AS item, count(*)::text AS value FROM properties
UNION ALL SELECT 'tenancy history rows', count(*)::text FROM properties_rent_history
UNION ALL SELECT 'property relations (amenities/media)', count(*)::text FROM properties_rels
UNION ALL SELECT 'property tags', count(*)::text FROM properties_tags
UNION ALL SELECT 'nearby connections', count(*)::text FROM properties_nearby_connectivity_connections
UNION ALL SELECT 'media', count(*)::text FROM media
UNION ALL SELECT 'media folders', count(*)::text FROM payload_folders
UNION ALL SELECT 'projects', count(*)::text FROM projects;

-- 2. ID sequences. rer_property_id_seq and rer_project_id_seq must not move.
SELECT sequencename, last_value FROM pg_sequences
WHERE schemaname = 'public' AND sequencename IN ('rer_property_id_seq', 'rer_project_id_seq')
ORDER BY sequencename;

-- 3. Highest stored IDs (must equal the sequence values above).
SELECT max(property_id) AS highest_property_id FROM properties;

-- 4. Legacy transaction data per property. Must be identical before and after:
--    the migration copies these columns, it never changes them.
SELECT purpose, status, count(*) FROM properties GROUP BY purpose, status ORDER BY 1, 2;
--    ^ `status` CAN change for a property the migration report flagged as
--      "incompatible-status" (e.g. a Sale marked Rented becomes Draft). Nothing else.

-- 5. Fingerprints. Identical before/after = not a single value changed.
--    Excludes status, updated_at and is_tenanted, which the roll-up maintains.
SELECT 'properties core + legacy pricing + owner + media' AS fingerprint, md5(string_agg(concat_ws('|',
  id, property_id, slug, title, purpose, property_category, property_type,
  location_locality, location_city, location_flat_no,
  pricing_price, pricing_price_on_request, pricing_negotiable, pricing_rent_amount, pricing_rent_period,
  pricing_security_deposit, pricing_maintenance_charges, pricing_brokerage_fee,
  pricing_total_lease_amount, pricing_monthly_lease_payment, pricing_parking_charges,
  details_bedrooms, details_carpet_area, building_details_building_name,
  media_featured_image_id, media_folder_id, current_agreement_end_date,
  owner_details_owner_name, owner_details_owner_contact, owner_details_open_to_selling
), ',' ORDER BY id)) AS md5 FROM properties
UNION ALL
SELECT 'tenancy history', md5(string_agg(concat_ws('|',
  _parent_id, _order, licensee_name, licensee_contact_number, monthly_rent, security_deposit,
  agreement_start_date, agreement_term_months, agreement_term_days, agreement_end_date, rental_source
), ',' ORDER BY _parent_id, _order)) FROM properties_rent_history
UNION ALL
SELECT 'property tags', md5(string_agg(concat_ws('|', parent_id, "order", value), ',' ORDER BY parent_id, "order")) FROM properties_tags
UNION ALL
SELECT 'property relations', md5(string_agg(concat_ws('|', parent_id, path, "order", amenities_id, media_id), ',' ORDER BY parent_id, path, "order")) FROM properties_rels;

-- 6. Every public URL that exists today. Each must still resolve after rollout
--    (see docs/LISTINGS-ROLLOUT.md › URL check).
SELECT slug FROM properties WHERE status IN ('available', 'under-offer') ORDER BY slug;
