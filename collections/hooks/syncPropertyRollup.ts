import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Payload,
  PayloadRequest,
} from 'payload';
import { computePropertyRollup } from '../../lib/listings/rollup';
import { findListingsOfProperty, relationId } from './listingRelations';

/**
 * Opt-out a caller may pass in `context` to save a listing without refreshing
 * its property (e.g. a bulk job that syncs once at the end). Nothing in the app
 * sets it today.
 */
export const SKIP_LISTING_ROLLUP = 'skipListingRollup';

/**
 * Recomputes a property's system-maintained `status` and `isTenanted` from its
 * listings (see `lib/listings/rollup.ts` for why they exist) and writes them
 * back only when they changed.
 *
 * Closing one listing therefore updates the property's summary but never
 * touches any other listing: this function only ever writes to `properties`.
 *
 * Joins the caller's transaction (`req`), so a rolled-back save leaves the
 * property exactly as it was.
 */
export async function syncPropertyRollup({
  payload,
  propertyId,
  req,
}: {
  payload: Payload;
  propertyId: number | string;
  req?: PayloadRequest;
}): Promise<void> {
  const listings = await findListingsOfProperty({ payload, propertyId, req });
  const rollup = computePropertyRollup(listings);

  const property = await payload.findByID({
    collection: 'properties',
    id: propertyId,
    depth: 0,
    select: { status: true, isTenanted: true },
    overrideAccess: true,
    disableErrors: true,
    req,
  });

  // The property is gone (deleted alongside its listings): nothing to update.
  if (!property) {
    return;
  }

  if (property.status === rollup.status && Boolean(property.isTenanted) === rollup.isTenanted) {
    return;
  }

  await payload.update({
    collection: 'properties',
    id: propertyId,
    data: { status: rollup.status, isTenanted: rollup.isTenanted },
    depth: 0,
    overrideAccess: true,
    // No context flag here: a property update never saves a listing, so this
    // cannot recurse, and with a shared `req` Payload merges `context` into
    // `req.context` — a flag set here would stay set and silently skip the
    // roll-up of any later listing saved in the same request.
    req,
  });
}

export const syncRollupAfterListingChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (context?.[SKIP_LISTING_ROLLUP]) {
    return doc;
  }

  const propertyId = relationId(doc.property);
  if (propertyId !== null) {
    await syncPropertyRollup({ payload: req.payload, propertyId, req });
  }

  // Defensive: a listing is never re-parented (validateListing rejects it), but
  // if a write bypassed hooks the old parent must not keep a stale summary.
  const previousId = relationId(previousDoc?.property);
  if (previousId !== null && propertyId !== null && String(previousId) !== String(propertyId)) {
    await syncPropertyRollup({ payload: req.payload, propertyId: previousId, req });
  }

  return doc;
};

export const syncRollupAfterListingDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const propertyId = relationId(doc?.property);
  if (propertyId !== null) {
    await syncPropertyRollup({ payload: req.payload, propertyId, req });
  }

  return doc;
};
