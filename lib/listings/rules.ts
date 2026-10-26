import {
  isActiveListingStatus,
  isListingStatus,
  isPublicListingStatus,
  isTenancyType,
  isTransactionType,
  TRANSACTION_TYPE_LABELS,
  type ListingStatus,
  type TransactionType,
} from './vocabulary';

/**
 * Business rules for a single Listing, as pure functions.
 *
 * The collection's `beforeChange` hook (collections/hooks/validateListing.ts)
 * gathers the facts that need the database — the parent's tenancy history, the
 * property's other listings — and passes them in here. Keeping the decisions
 * free of Payload makes them unit-testable and means the admin form, the REST
 * API, the Local API and every script go through exactly one definition.
 */

export type ListingPricingInput = {
  price?: number | null;
  priceOnRequest?: boolean | null;
  rentAmount?: number | null;
  monthlyLeasePayment?: number | null;
  totalLeaseAmount?: number | null;
  securityDeposit?: number | null;
  maintenanceCharges?: number | null;
  brokerageFee?: number | null;
  parkingCharges?: number | null;
  pricePerSqFt?: number | null;
  additionalCharges?: number | null;
};

export type ListingRuleInput = {
  transactionType?: unknown;
  status?: unknown;
  pricing?: ListingPricingInput | null;
};

export type ListingRuleContext = {
  /**
   * Whether the parent property has at least one Tenancy History entry. `null`
   * means "not looked up" and skips the tenancy rule.
   */
  parentHasTenancyHistory?: boolean | null;
  /**
   * Skips the "must have a price to go live" rule. Only the legacy migration
   * sets this: it must carry a live listing across exactly as it was, even when
   * the original record was incomplete, and report the gap instead.
   */
  allowIncompletePricing?: boolean;
};

export type ListingRuleError = {
  /** Dotted field path the admin form attaches the message to. */
  path: string;
  message: string;
};

const NON_NEGATIVE_FIELDS: Array<[keyof ListingPricingInput, string]> = [
  ['price', 'Price'],
  ['rentAmount', 'Rent Amount'],
  ['monthlyLeasePayment', 'Monthly Lease Payment'],
  ['totalLeaseAmount', 'Total Lease Amount'],
  ['securityDeposit', 'Security Deposit'],
  ['maintenanceCharges', 'Maintenance Charges'],
  ['brokerageFee', 'Brokerage Fee'],
  ['parkingCharges', 'Parking Charges'],
  ['pricePerSqFt', 'Price per sq ft'],
  ['additionalCharges', 'Additional Charges'],
];

function isPositive(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** The field a live listing of this type must have an amount in. */
export function requiredAmountFields(type: TransactionType): Array<keyof ListingPricingInput> {
  if (type === 'sale') {
    return ['price'];
  }

  if (type === 'rent') {
    return ['rentAmount'];
  }

  return ['monthlyLeasePayment', 'totalLeaseAmount'];
}

export function validateListingRules(
  input: ListingRuleInput,
  context: ListingRuleContext = {},
): ListingRuleError[] {
  const errors: ListingRuleError[] = [];

  if (!isTransactionType(input.transactionType)) {
    errors.push({ path: 'transactionType', message: 'Choose a transaction type: Sale, Rent or Lease.' });
    return errors;
  }

  const type = input.transactionType;
  const label = TRANSACTION_TYPE_LABELS[type];

  if (!isListingStatus(input.status)) {
    errors.push({ path: 'status', message: 'Choose a listing status.' });
    return errors;
  }

  const status: ListingStatus = input.status;
  const pricing = input.pricing ?? {};

  if (type === 'sale' && status === 'rented') {
    errors.push({
      path: 'status',
      message: 'A Sale listing cannot be marked Rented. Use Sold once the sale completes.',
    });
  }

  if (isTenancyType(type) && status === 'sold') {
    errors.push({
      path: 'status',
      message: `A ${label} listing cannot be marked Sold. Use Rented once a tenant is in place.`,
    });
  }

  for (const [field, fieldLabel] of NON_NEGATIVE_FIELDS) {
    const value = pricing[field];
    if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) {
      errors.push({ path: `pricing.${field}`, message: `${fieldLabel} cannot be negative.` });
    }
  }

  // A listing only needs an amount once it can be seen. Drafts and closed
  // listings stay saveable half-finished, as incomplete inventory always was.
  if (
    !context.allowIncompletePricing &&
    isPublicListingStatus(status) &&
    pricing.priceOnRequest !== true
  ) {
    const fields = requiredAmountFields(type);
    if (!fields.some((field) => isPositive(pricing[field]))) {
      const first = fields[0];
      errors.push({
        path: `pricing.${first}`,
        message:
          type === 'sale'
            ? 'A live Sale listing needs a Price, or tick Price on request.'
            : type === 'rent'
              ? 'A live Rent listing needs a Rent Amount, or tick Price on request.'
              : 'A live Lease listing needs a Monthly Lease Payment or Total Lease Amount, or tick Price on request.',
      });
    }
  }

  if (isTenancyType(type) && status === 'rented' && context.parentHasTenancyHistory === false) {
    errors.push({
      path: 'status',
      message:
        'Add at least one Tenancy History entry on the property (Rent Details tab) before marking this listing Rented.',
    });
  }

  return errors;
}

export type SiblingListing = {
  id: number | string;
  listingId?: string | null;
  transactionType?: unknown;
  status?: unknown;
};

/**
 * One *active* listing per transaction type per property.
 *
 * "Active" means not yet closed (draft, available, under-offer). Two live Sale
 * listings for one flat would show the same unit twice at possibly different
 * prices; closed listings are history and never collide. Returns the sibling
 * that blocks the save, if any.
 */
export function findActiveDuplicate(
  candidate: { id?: number | string | null; transactionType?: unknown; status?: unknown },
  siblings: SiblingListing[],
): SiblingListing | null {
  if (!isTransactionType(candidate.transactionType) || !isActiveListingStatus(candidate.status)) {
    return null;
  }

  return (
    siblings.find(
      (sibling) =>
        String(sibling.id) !== String(candidate.id ?? '') &&
        sibling.transactionType === candidate.transactionType &&
        isActiveListingStatus(sibling.status),
    ) ?? null
  );
}

export function describeDuplicate(type: TransactionType, sibling: SiblingListing): string {
  const ref = sibling.listingId ? ` (${sibling.listingId})` : '';
  return `This property already has an active ${TRANSACTION_TYPE_LABELS[type]} listing${ref}. Edit that listing, or mark it ${
    isTenancyType(type) ? 'Rented' : 'Sold'
  } / Withdrawn before adding another.`;
}
