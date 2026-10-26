import { APIError, type CollectionBeforeDeleteHook } from 'payload';

/**
 * A property that still has listings cannot be deleted.
 *
 * Without this the delete would either orphan the listings or fail deep in the
 * database on the foreign key. Refusing up front, with a message that says what
 * to do, is the property-side half of the guarantee; the listing-side half is
 * structural: listings reference properties, not the other way round, so
 * deleting a listing leaves the property and its other listings untouched.
 */
export const protectPropertyWithListings: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { totalDocs } = await req.payload.count({
    collection: 'listings',
    where: { property: { equals: id } },
    overrideAccess: true,
    req,
  });

  if (totalDocs > 0) {
    throw new APIError(
      `This property still has ${totalDocs} listing${totalDocs === 1 ? '' : 's'}. A property with listings cannot be deleted, because its listings (including sold, rented and withdrawn ones) are its transaction history. Delete those listings first if they really must go.`,
      409,
      undefined,
      true,
    );
  }
};
