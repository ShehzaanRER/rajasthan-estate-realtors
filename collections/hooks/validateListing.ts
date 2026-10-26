import { ValidationError, type CollectionBeforeChangeHook } from 'payload';
import {
  describeDuplicate,
  findActiveDuplicate,
  validateListingRules,
  type ListingRuleError,
} from '../../lib/listings/rules';
import { isTenancyType, isTransactionType } from '../../lib/listings/vocabulary';
import { findListingsOfProperty, relationId } from './listingRelations';

/**
 * Context flag the legacy migration sets so a live listing can be carried
 * across exactly as it was, even when the original record was incomplete (no
 * price). Everything structural is still enforced — see `ListingRuleContext`.
 */
export const ALLOW_INCOMPLETE_PRICING = 'allowIncompleteListingPricing';

/**
 * Context flag for the legacy migration: a migrated listing inherits its
 * property's slug verbatim, and some legacy slugs ("Andheri", "New1") predate
 * the lowercase-hyphen rule. The slug field's strict create-time shape check is
 * skipped for them; characters that would break a URL are still rejected.
 */
export const ALLOW_LEGACY_SLUG = 'allowLegacyListingSlug';

/**
 * Enforces the Listing business rules on the server, for every caller — the
 * admin form, the REST API, the Local API and scripts alike. Nothing here is a
 * front-end-only check.
 *
 *  - the parent property exists and is readable by the caller;
 *  - a listing is never re-parented after creation;
 *  - transaction-specific rules (`lib/listings/rules.ts`): status fits the
 *    transaction type, a live listing has an amount, a Rented listing has a
 *    tenancy on record;
 *  - at most one *active* listing per transaction type per property.
 *
 * Runs as a collection `beforeChange` hook, after the ID and slug hooks and
 * before field-level validation. Failures are thrown as a `ValidationError` so
 * the admin shows each message against its own field.
 */
export const validateListing: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
  context,
}) => {
  const errors: ListingRuleError[] = [];

  // Partial updates over the API only send what changed; judge the whole listing.
  const merged = {
    ...(originalDoc ?? {}),
    ...data,
    pricing: { ...(originalDoc?.pricing ?? {}), ...(data.pricing ?? {}) },
  };

  const propertyId = relationId(merged.property);
  const originalPropertyId = relationId(originalDoc?.property);

  if (propertyId === null) {
    errors.push({ path: 'property', message: 'Choose the property this listing belongs to.' });
  } else if (
    operation === 'update' &&
    originalPropertyId !== null &&
    String(originalPropertyId) !== String(propertyId)
  ) {
    errors.push({
      path: 'property',
      message:
        'A listing cannot be moved to a different property. Withdraw it and create a new listing on the other property instead.',
    });
  }

  let parentHasTenancyHistory: boolean | null = null;

  if (propertyId !== null && errors.length === 0) {
    const property = await req.payload.findByID({
      collection: 'properties',
      id: propertyId,
      depth: 0,
      select: { rentHistory: true },
      // Honour the caller's own read access when there is a signed-in user;
      // scripts run through the Local API without one.
      overrideAccess: !req.user,
      user: req.user,
      disableErrors: true,
      req,
    });

    if (!property) {
      errors.push({
        path: 'property',
        message: 'The selected property does not exist, or you do not have access to it.',
      });
    } else if (isTransactionType(merged.transactionType) && isTenancyType(merged.transactionType)) {
      parentHasTenancyHistory = Array.isArray(property.rentHistory) && property.rentHistory.length > 0;
    }
  }

  errors.push(
    ...validateListingRules(merged, {
      parentHasTenancyHistory,
      allowIncompletePricing: context?.[ALLOW_INCOMPLETE_PRICING] === true,
    }),
  );

  if (propertyId !== null && isTransactionType(merged.transactionType) && errors.length === 0) {
    const siblings = await findListingsOfProperty({ payload: req.payload, propertyId, req });
    const duplicate = findActiveDuplicate(
      { id: originalDoc?.id, transactionType: merged.transactionType, status: merged.status },
      siblings,
    );

    if (duplicate) {
      errors.push({
        path: 'transactionType',
        message: describeDuplicate(merged.transactionType, duplicate),
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError({ collection: 'listings', errors, req }, req.t);
  }

  return data;
};
