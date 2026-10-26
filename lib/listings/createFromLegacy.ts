import type { Payload } from 'payload';
import {
  ALLOW_INCOMPLETE_PRICING,
  ALLOW_LEGACY_SLUG,
} from '../../collections/hooks/validateListing';
import type { Property } from '../../payload-types';
import { planListingFromLegacyProperty, type MigrationIssue } from './legacy';

/**
 * Creates the Listing a freshly written property implies, for the importers and
 * seed scripts that still describe a property in the old single-record shape
 * (`purpose` + `pricing` + `status` on the property itself).
 *
 * The same planner the one-time migration uses decides what the listing holds,
 * so a record imported tomorrow ends up exactly as a record migrated today.
 * Idempotent: if the property already has a listing of that transaction type,
 * nothing is created.
 *
 * Returns the created listing's ID (or null) plus any issues the planner raised;
 * a failure to create is thrown so the caller reports it against the row.
 */
export async function createListingForLegacyProperty(
  payload: Payload,
  property: Pick<Property, 'id' | 'propertyId' | 'slug' | 'purpose' | 'status' | 'tags' | 'pricing'>,
): Promise<{ listingId: string | null; issues: MigrationIssue[] }> {
  const existing = await payload.find({
    collection: 'listings',
    where: { property: { equals: property.id } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });

  const plan = planListingFromLegacyProperty(
    property as Parameters<typeof planListingFromLegacyProperty>[0],
    existing.docs,
  );

  if (plan.action !== 'create' || !plan.listing) {
    return { listingId: null, issues: plan.issues };
  }

  const doc = await payload.create({
    collection: 'listings',
    data: plan.listing as never,
    overrideAccess: true,
    depth: 0,
    context: { [ALLOW_INCOMPLETE_PRICING]: true, [ALLOW_LEGACY_SLUG]: true },
  });

  return { listingId: doc.listingId ?? null, issues: plan.issues };
}
