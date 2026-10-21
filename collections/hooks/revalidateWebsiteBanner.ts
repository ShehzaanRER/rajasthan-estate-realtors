import { revalidatePath } from 'next/cache';
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from 'payload';
import { placementPath } from '../../lib/website-banners/placements';

type BannerState = { placement?: unknown; _status?: unknown } | null | undefined;

/**
 * The public paths a banner write can change, and nothing else.
 *
 * Only a published version is ever visible, so a write matters when the
 * record is published now (a publish or re-publish) or was published before
 * it (an unpublish, or a draft saved over a live banner — harmless to refresh).
 * Saving a draft of a banner that has never been live changes nothing public
 * and returns no paths.
 *
 * Both placements are included because a record can be created under one
 * placement and, while still empty, be moved to another.
 *
 * `/` and `/about` are prerendered at build time, so this is what makes a
 * publish visible on them at all. `/properties`, `/projects` and `/contact`
 * read their search params and render per request; revalidating them is a
 * no-op that keeps the rule uniform if that ever changes.
 */
export function bannerPathsToRevalidate(doc: BannerState, previousDoc?: BannerState): string[] {
  const isLive = doc?._status === 'published';
  const wasLive = previousDoc?._status === 'published';

  if (!isLive && !wasLive) {
    return [];
  }

  const paths = [placementPath(doc?.placement), placementPath(previousDoc?.placement)].filter(
    (path): path is string => path !== null,
  );

  return [...new Set(paths)];
}

/**
 * `revalidatePath` only works inside a Next request (the admin's save goes
 * through the `/api/[...slug]` route handler, so it does). A Local API write
 * from `payload run` has no request store and throws; that is logged, not
 * raised, so a script is never failed by a cache it cannot reach.
 */
function revalidate(paths: string[], payload: Payload) {
  for (const path of paths) {
    try {
      revalidatePath(path);
      payload.logger.info(`[website-banners] revalidated ${path}`);
    } catch (error) {
      payload.logger.warn(
        `[website-banners] could not revalidate ${path} outside a Next.js request (${
          (error as Error).message
        }). It refreshes on the next deploy.`,
      );
    }
  }
}

export const revalidateBannerAfterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (!context.disableRevalidate) {
    revalidate(bannerPathsToRevalidate(doc, previousDoc), req.payload);
  }

  return doc;
};

export const revalidateBannerAfterDelete: CollectionAfterDeleteHook = ({ doc, req, context }) => {
  if (!context.disableRevalidate) {
    revalidate(bannerPathsToRevalidate(doc), req.payload);
  }

  return doc;
};
