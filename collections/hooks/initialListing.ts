import {
  ValidationError,
  type CollectionAfterChangeHook,
  type CollectionBeforeValidateHook,
} from 'payload';
import { validateListingRules, type ListingPricingInput } from '../../lib/listings/rules';
import { isTransactionType, type TransactionType } from '../../lib/listings/vocabulary';

/**
 * "Create the property and its first listing in one save."
 *
 * The property create form carries a virtual `initialListing` group (never
 * stored on the property). These two hooks turn it into a real Listing:
 *
 *  1. `validateInitialListing` (collection `beforeValidate`, create only) checks
 *     the listing with the same rules a Listing save uses, BEFORE anything is
 *     written and before the Property ID is allocated. A bad price therefore
 *     fails the whole form with the message on the right field, and burns no
 *     Property ID.
 *  2. `createInitialListing` (collection `afterChange`, create only) creates the
 *     listing through the normal Listings collection — its own ID, slug,
 *     validation and roll-up hooks all run — inside the SAME transaction as the
 *     property (`req`). If it still fails, Payload rolls the whole save back: no
 *     property without its listing, no orphan media folder.
 *
 * The second and later listings are added from the property's Listings tab.
 */

export const INITIAL_LISTING_CONTEXT_KEY = 'rerInitialListing';

export type InitialListingInput = {
  transactionType?: string | null;
  status?: string | null;
  price?: number | null;
  priceOnRequest?: boolean | null;
  negotiable?: boolean | null;
  rentAmount?: number | null;
  securityDeposit?: number | null;
  maintenanceCharges?: number | null;
};

export type InitialListingData = {
  transactionType: TransactionType;
  status: 'draft' | 'available';
  pricing: ListingPricingInput & { negotiable?: boolean; rentPeriod?: 'monthly' };
};

/** Field path inside the form for each listing pricing field. */
const FORM_PATH: Record<string, string> = {
  'pricing.price': 'initialListing.price',
  'pricing.rentAmount': 'initialListing.rentAmount',
  'pricing.securityDeposit': 'initialListing.securityDeposit',
  'pricing.maintenanceCharges': 'initialListing.maintenanceCharges',
  status: 'initialListing.status',
  transactionType: 'initialListing.transactionType',
};

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Pure: turns the form group into listing data, or null when no first listing
 * was asked for. Fields that do not belong to the chosen type are dropped, so a
 * rent amount typed before switching to Sale is not carried into a sale listing.
 */
export function buildInitialListing(input: InitialListingInput | null | undefined): InitialListingData | null {
  if (!input || !isTransactionType(input.transactionType) || input.transactionType === 'lease') {
    return null;
  }

  const type = input.transactionType;
  const pricing: InitialListingData['pricing'] = {
    priceOnRequest: input.priceOnRequest === true,
    negotiable: input.negotiable === true,
  };

  if (type === 'sale') {
    pricing.price = numberOrUndefined(input.price);
  } else {
    pricing.rentAmount = numberOrUndefined(input.rentAmount);
    pricing.securityDeposit = numberOrUndefined(input.securityDeposit);
    pricing.maintenanceCharges = numberOrUndefined(input.maintenanceCharges);
    pricing.rentPeriod = 'monthly';
  }

  return {
    transactionType: type,
    status: input.status === 'available' ? 'available' : 'draft',
    pricing,
  };
}

export const validateInitialListing: CollectionBeforeValidateHook = ({ data, operation, req, context }) => {
  if (operation !== 'create' || !data) {
    return data;
  }

  const listing = buildInitialListing(data.initialListing as InitialListingInput | undefined);
  if (!listing) {
    return data;
  }

  const rentHistory = Array.isArray(data.rentHistory) ? data.rentHistory : [];
  const errors = validateListingRules(listing, { parentHasTenancyHistory: rentHistory.length > 0 }).map(
    (error) => ({ path: FORM_PATH[error.path] ?? 'initialListing', message: error.message }),
  );

  if (errors.length > 0) {
    throw new ValidationError({ collection: 'properties', errors, req }, req.t);
  }

  // Carried to afterChange through the request context: the group is virtual,
  // so it is not part of the stored document the later hooks see.
  context[INITIAL_LISTING_CONTEXT_KEY] = listing;
  return data;
};

export const createInitialListing: CollectionAfterChangeHook = async ({ doc, operation, req, context }) => {
  if (operation !== 'create') {
    return doc;
  }

  const listing = context[INITIAL_LISTING_CONTEXT_KEY] as InitialListingData | undefined;
  if (!listing) {
    return doc;
  }

  // Consumed once: a nested save in the same request must not create it again.
  delete context[INITIAL_LISTING_CONTEXT_KEY];

  await req.payload.create({
    collection: 'listings',
    data: { property: doc.id, ...listing } as never,
    depth: 0,
    // Same permission the editor needs to create a listing directly.
    overrideAccess: !req.user,
    user: req.user,
    req,
  });

  return doc;
};
