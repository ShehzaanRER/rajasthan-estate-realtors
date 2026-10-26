import {
  isListingLevelTag,
  isListingStatus,
  isTenancyType,
  isTransactionType,
  closedStatusFor,
  PUBLIC_LISTING_STATUSES,
  TRANSACTION_TYPE_LABELS,
  type ListingStatus,
  type TransactionType,
} from './vocabulary';
import { requiredAmountFields, type ListingPricingInput } from './rules';

/**
 * Turning a pre-listings Property (one record = one transaction) into the
 * Listing it implies. Pure, so the exact same decisions are unit-tested and
 * then executed by `scripts/migrate-property-listings.ts` and by the CSV
 * importer when it creates a property.
 *
 * ## Principles
 *
 * 1. **Copy, never move.** The legacy `purpose`, `status`, `pricing` and `tags`
 *    stay on the property untouched. If any listing cannot be created, the
 *    original data is still exactly where it was.
 * 2. **Preserve, then flag.** A value that is odd but representable is carried
 *    across as it was and reported as a warning. A value that cannot be
 *    represented (an unknown transaction type, a negative amount) is an error:
 *    no listing is created for that property and the reason is reported.
 *    Nothing is silently defaulted or dropped.
 * 3. **Idempotent.** A property that already has a listing of the same
 *    transaction type is skipped, so re-running can never create a duplicate.
 */

export type LegacyPropertyInput = {
  id: number | string;
  propertyId?: string | null;
  slug?: string | null;
  purpose?: unknown;
  status?: unknown;
  tags?: readonly string[] | null;
  pricing?: (ListingPricingInput & Record<string, unknown>) | null;
};

export type ExistingListingInput = {
  transactionType?: unknown;
};

export type MigrationIssue = {
  level: 'warning' | 'error';
  code: string;
  message: string;
};

export type LegacyListingData = {
  property: number | string;
  transactionType: TransactionType;
  status: ListingStatus;
  slug: string;
  tags: string[];
  pricing: Record<string, unknown>;
  internalNotes: string;
};

export type ListingMigrationPlan = {
  property: LegacyPropertyInput;
  action: 'create' | 'skip-existing' | 'skip-error';
  listing: LegacyListingData | null;
  issues: MigrationIssue[];
};

const NON_NEGATIVE_KEYS: Array<keyof ListingPricingInput> = [
  'price',
  'rentAmount',
  'monthlyLeasePayment',
  'totalLeaseAmount',
  'securityDeposit',
  'maintenanceCharges',
  'brokerageFee',
  'parkingCharges',
  'pricePerSqFt',
  'additionalCharges',
];

function hasPositive(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function planListingFromLegacyProperty(
  property: LegacyPropertyInput,
  existingListings: readonly ExistingListingInput[] = [],
  now: Date = new Date(),
): ListingMigrationPlan {
  const issues: MigrationIssue[] = [];
  const ref = property.propertyId ?? String(property.id);

  const fail = (code: string, message: string): ListingMigrationPlan => ({
    property,
    action: 'skip-error',
    listing: null,
    issues: [...issues, { level: 'error', code, message }],
  });

  if (!isTransactionType(property.purpose)) {
    return fail(
      'invalid-purpose',
      `${ref}: transaction type "${String(property.purpose ?? '')}" is not sale, rent or lease. No listing created; the property is untouched and needs a manual decision.`,
    );
  }

  const type = property.purpose;

  if (existingListings.some((listing) => listing.transactionType === type)) {
    return {
      property,
      action: 'skip-existing',
      listing: null,
      issues: [],
    };
  }

  const slug = typeof property.slug === 'string' ? property.slug.trim() : '';
  if (!slug) {
    return fail(
      'missing-slug',
      `${ref}: the property has no slug, so the listing cannot inherit its public URL. No listing created.`,
    );
  }

  if (!isListingStatus(property.status)) {
    return fail(
      'invalid-status',
      `${ref}: status "${String(property.status ?? '')}" is not a known status. No listing created; the property is untouched.`,
    );
  }

  const pricing: Record<string, unknown> = { ...(property.pricing ?? {}) };

  for (const key of NON_NEGATIVE_KEYS) {
    const value = pricing[key];
    if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) {
      issues.push({
        level: 'error',
        code: 'negative-amount',
        message: `${ref}: pricing.${key} is ${value}, which a listing cannot hold. No listing created; the original value is untouched on the property.`,
      });
    }
  }

  if (issues.some((issue) => issue.level === 'error')) {
    return { property, action: 'skip-error', listing: null, issues };
  }

  let status: ListingStatus = property.status;
  const notes: string[] = [
    `Migrated ${now.toISOString().slice(0, 10)} from ${ref}'s single-transaction record (status "${property.status}", transaction "${type}"). The original fields remain on the property.`,
  ];

  // A closed status that does not fit the transaction (Rented on a sale, Sold on
  // a rent) is meaningless on a listing. It is not guessed at: the listing is
  // created as a non-public Draft, which is also what the property effectively
  // was (neither is on the website), and the original status is recorded.
  const wrongClosed =
    (type === 'sale' && status === 'rented') || (isTenancyType(type) && status === 'sold');
  if (wrongClosed) {
    issues.push({
      level: 'warning',
      code: 'incompatible-status',
      message: `${ref}: a ${TRANSACTION_TYPE_LABELS[type]} record had status "${status}", which does not fit a ${TRANSACTION_TYPE_LABELS[type]} listing (it would be "${closedStatusFor(type)}"). Created as Draft; original status noted on the listing. Review it.`,
    });
    notes.push(`Original status "${status}" does not fit a ${type} listing; created as Draft for review.`);
    status = 'draft';
  }

  const isLive = (PUBLIC_LISTING_STATUSES as readonly string[]).includes(status);

  const amountFields = requiredAmountFields(type);
  const hasOwnAmount = amountFields.some((field) => hasPositive(pricing[field]));
  // mapPricing() falls back to the sale `price` for a rent or lease with no
  // amount of its own, so such a record has been showing that number publicly.
  const showsSalePriceInstead = type !== 'sale' && !hasOwnAmount && hasPositive(pricing.price);

  if (showsSalePriceInstead) {
    issues.push({
      level: 'warning',
      code: 'rent-from-sale-price',
      message: `${ref}: ${TRANSACTION_TYPE_LABELS[type]} record has no ${amountFields.join(' / ')} but has a sale price; the website has been displaying that price instead. Carried across unchanged (it keeps displaying) — move it into the right field. The listing cannot be saved as live again until you do.`,
    });
  } else if (isLive && pricing.priceOnRequest !== true && !hasOwnAmount) {
    issues.push({
      level: 'warning',
      code: 'live-without-price',
      message: `${ref}: live ${TRANSACTION_TYPE_LABELS[type]} listing has no ${amountFields.join(' / ')}. Carried across as it was (the website already showed "Price on request"); add a price.`,
    });
  }

  const tags = (property.tags ?? []).filter((tag) => isListingLevelTag(tag));

  return {
    property,
    action: 'create',
    listing: {
      property: property.id,
      transactionType: type,
      status,
      slug,
      tags,
      pricing,
      internalNotes: notes.join(' '),
    },
    issues,
  };
}

export type MigrationSummary = {
  total: number;
  create: number;
  skipExisting: number;
  skipError: number;
  warnings: number;
};

export function summarisePlans(plans: readonly ListingMigrationPlan[]): MigrationSummary {
  return {
    total: plans.length,
    create: plans.filter((plan) => plan.action === 'create').length,
    skipExisting: plans.filter((plan) => plan.action === 'skip-existing').length,
    skipError: plans.filter((plan) => plan.action === 'skip-error').length,
    warnings: plans.reduce(
      (count, plan) => count + plan.issues.filter((issue) => issue.level === 'warning').length,
      0,
    ),
  };
}
