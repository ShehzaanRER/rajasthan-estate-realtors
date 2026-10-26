import type { CollectionConfig } from 'payload';

type AfterErrorHook = NonNullable<NonNullable<CollectionConfig['hooks']>['afterError']>[number];

type FieldError = { message?: string; path?: string };
type ErrorEntry = { data?: { errors?: FieldError[] }; message?: string };

export const DUPLICATE_ACTIVE_LISTING_MESSAGE =
  'This property already has an active listing of this transaction type — probably saved a moment ago, possibly by someone else. Reload the property to see it, or mark that listing Sold / Rented / Withdrawn before adding another.';

/** True for the error Payload raises when the partial unique index rejects a save. */
export function isDuplicateActiveListingError(errors: FieldError[] | undefined): boolean {
  return (errors ?? []).some(
    (error) => error.path === 'transactionType' && /unique/i.test(error.message ?? ''),
  );
}

/**
 * Rewrites the database's generic "Value must be unique" into an explanation.
 *
 * `validateListing` normally reports a duplicate itself, with the existing
 * listing's ID. The only way to reach the database index instead is a race: two
 * saves at the same instant both passed that check. The index then rejects the
 * second one and Payload reports it as a uniqueness error on Transaction type
 * (see `listingIndexSchema.ts`). This hook gives that response the same meaning
 * in plain words for the admin and the REST API. Nothing was written: the failed
 * save was rolled back.
 */
export const explainDuplicateListingError: AfterErrorHook = ({ result }) => {
  const entries = (result?.errors ?? []) as ErrorEntry[];
  if (!entries.some((entry) => isDuplicateActiveListingError(entry.data?.errors))) {
    return;
  }

  return {
    response: {
      ...result,
      errors: entries.map((entry) => ({
        ...entry,
        message: DUPLICATE_ACTIVE_LISTING_MESSAGE,
        data: entry.data
          ? {
              ...entry.data,
              errors: (entry.data.errors ?? []).map((error) =>
                isDuplicateActiveListingError([error])
                  ? { ...error, message: DUPLICATE_ACTIVE_LISTING_MESSAGE }
                  : error,
              ),
            }
          : entry.data,
      })),
    } as never,
    status: 400,
  };
};
