-- UNDO of docs/listings-schema.sql — emergency schema rollback for the listings change.
--
-- READ docs/LISTINGS-ROLLOUT.md › "Recovery" BEFORE USING THIS.
--
-- * It DELETES every listing. Listings migrated from legacy properties can be
--   recreated (the legacy columns were copied, never moved), but any listing
--   created or edited after the rollout — prices, statuses, new rentals — is lost
--   unless exported first. Prefer a CODE rollback, which needs no schema change.
-- * It does NOT restore properties.status / updated_at values the roll-up changed
--   during the migration; only the backup can.
-- * The final SET NOT NULL fails (and the whole transaction rolls back, changing
--   nothing) if any property was created without a legacy purpose after rollout.
-- * Run only with the PREVIOUS code deployed, or the running app will error on
--   the missing tables.
--
-- Verified against a scratch database: after this script, the pre-listings code's
-- schema push reports no listings-related difference.
BEGIN;
ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_listings_fk";
DROP INDEX IF EXISTS "payload_locked_documents_rels_listings_id_idx";
ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "listings_id";
DROP TABLE IF EXISTS "listings_tags";
DROP TABLE IF EXISTS "listings";
DROP TYPE IF EXISTS "enum_listings_tags";
DROP TYPE IF EXISTS "enum_listings_status";
DROP TYPE IF EXISTS "enum_listings_transaction_type";
DROP TYPE IF EXISTS "enum_listings_pricing_currency";
DROP TYPE IF EXISTS "enum_listings_pricing_rent_period";
DROP SEQUENCE IF EXISTS "rer_listing_id_seq";
DROP INDEX IF EXISTS "properties_is_tenanted_idx";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "is_tenanted";
ALTER TABLE "properties" ALTER COLUMN "purpose" SET NOT NULL;
COMMIT;
