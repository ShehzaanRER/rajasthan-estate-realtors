-- Listings schema change — the exact statements Payload's schema push generates
-- for this branch against the pre-listings schema (commit f1df8a6).
--
-- Generated with:
--   PAYLOAD_MIGRATING=true RER_SCHEMA_SQL_OUT=<file> npx payload run scripts/preview-schema-push.ts
-- against a scratch database built from f1df8a6. A read-only preview against the
-- live database on 2026-10-23 produced the same statements except the partial
-- unique index (added afterwards). Re-run the preview against production
-- (read-only) and diff it with this file before applying anything.
--
-- Purely additive: new types, sequence, tables, indexes and foreign keys; two new
-- nullable columns; and ONE relaxation (properties.purpose DROP NOT NULL).
-- Nothing is dropped, renamed or rewritten. All in one transaction: it either
-- applies completely or not at all.
--
-- Deliberately NOT included: two statements every push also emits for unrelated,
-- pre-existing drift — they are not part of this change:
--   ALTER TABLE "channel_partners" ALTER COLUMN "display_order" SET DEFAULT 0;
--   ALTER TABLE "users" ALTER COLUMN "login_attempts" SET DEFAULT 0;
--
-- Rollout procedure, verification and undo: docs/LISTINGS-ROLLOUT.md.
BEGIN;
CREATE TYPE "public"."enum_listings_tags" AS ENUM('featured', 'new', 'premium', 'price-reduced');
CREATE TYPE "public"."enum_listings_status" AS ENUM('draft', 'available', 'under-offer', 'sold', 'rented', 'withdrawn');
CREATE TYPE "public"."enum_listings_transaction_type" AS ENUM('sale', 'rent', 'lease');
CREATE TYPE "public"."enum_listings_pricing_currency" AS ENUM('INR');
CREATE TYPE "public"."enum_listings_pricing_rent_period" AS ENUM('monthly', 'quarterly', 'yearly');
CREATE SEQUENCE "public"."rer_listing_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;
CREATE TABLE "listings_tags" (
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"value" "enum_listings_tags",
	"id" serial PRIMARY KEY NOT NULL
);
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" varchar,
	"status" "enum_listings_status" DEFAULT 'draft' NOT NULL,
	"property_id" integer NOT NULL,
	"transaction_type" "enum_listings_transaction_type" NOT NULL,
	"slug" varchar NOT NULL,
	"pricing_currency" "enum_listings_pricing_currency" DEFAULT 'INR',
	"pricing_price" numeric,
	"pricing_price_on_request" boolean DEFAULT false,
	"pricing_negotiable" boolean DEFAULT false,
	"pricing_price_per_sq_ft" numeric,
	"pricing_additional_charges" numeric,
	"pricing_rent_amount" numeric,
	"pricing_rent_period" "enum_listings_pricing_rent_period" DEFAULT 'monthly',
	"pricing_security_deposit" numeric,
	"pricing_maintenance_charges" numeric,
	"pricing_maintenance_included" boolean DEFAULT false,
	"pricing_brokerage_fee" numeric,
	"pricing_total_lease_amount" numeric,
	"pricing_monthly_lease_payment" numeric,
	"pricing_parking_charges" numeric,
	"assigned_agent_id" integer,
	"internal_notes" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "properties" ALTER COLUMN "purpose" DROP NOT NULL;
ALTER TABLE "properties" ADD COLUMN "is_tenanted" boolean DEFAULT false;
ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "listings_id" integer;
ALTER TABLE "listings_tags" ADD CONSTRAINT "listings_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "listings" ADD CONSTRAINT "listings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "listings" ADD CONSTRAINT "listings_assigned_agent_id_users_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "listings_tags_order_idx" ON "listings_tags" USING btree ("order");
CREATE INDEX "listings_tags_parent_idx" ON "listings_tags" USING btree ("parent_id");
CREATE UNIQUE INDEX "listings_listing_id_idx" ON "listings" USING btree ("listing_id");
CREATE INDEX "listings_status_idx" ON "listings" USING btree ("status");
CREATE INDEX "listings_property_idx" ON "listings" USING btree ("property_id");
CREATE INDEX "listings_transaction_type_idx" ON "listings" USING btree ("transaction_type");
CREATE UNIQUE INDEX "listings_slug_idx" ON "listings" USING btree ("slug");
CREATE INDEX "listings_assigned_agent_idx" ON "listings" USING btree ("assigned_agent_id");
CREATE INDEX "listings_updated_at_idx" ON "listings" USING btree ("updated_at");
CREATE INDEX "listings_created_at_idx" ON "listings" USING btree ("created_at");
CREATE UNIQUE INDEX "listings_one_active_per_type_idx" ON "listings" USING btree ("property_id","transaction_type") WHERE (status = ANY (ARRAY['draft'::enum_listings_status, 'available'::enum_listings_status, 'under-offer'::enum_listings_status]));
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_listings_fk" FOREIGN KEY ("listings_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "properties_is_tenanted_idx" ON "properties" USING btree ("is_tenanted");
CREATE INDEX "payload_locked_documents_rels_listings_id_idx" ON "payload_locked_documents_rels" USING btree ("listings_id");
COMMIT;
