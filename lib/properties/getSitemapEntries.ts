import { getPayloadClient } from '../payload';
import { publicStatusWhere } from './publicScope';

export type SitemapEntry = {
  slug: string;
  updatedAt: string | null;
};

/**
 * Page size for the sitemap sweep. Unrelated to `PUBLIC_PROPERTY_LIMIT` in
 * `getProperties.ts` — that one bounds what a visitor sees on one screen, this
 * one only controls how many rows come back per round trip.
 */
const SITEMAP_PAGE_SIZE = 500;

/**
 * Every published property, for `app/sitemap.ts`.
 *
 * Deliberately a separate query from `getProperties()` rather than the same one
 * with a larger limit, because the two have genuinely different requirements.
 * A sitemap has to be exhaustive; a listing page has to be fast and bounded.
 * Sharing one query meant they also shared a 100-record ceiling *and* a
 * `-updatedAt` sort, so the 101st property would have become simultaneously
 * unlinked and unlisted — undiscoverable, with no error anywhere.
 *
 * It is also far cheaper than what it replaces. The sitemap previously pulled
 * 100 fully-populated documents at `depth: 2` and ran the complete
 * `mapProperty()` over each one, in order to read `.slug` off the result.
 * This reads two columns at `depth: 0`.
 *
 * Visibility is unchanged and not reimplemented: `publicStatusWhere()` plus
 * `overrideAccess: false`, exactly as every other public query does, so drafts,
 * sold and rented properties stay out.
 */
export async function getPropertySitemapEntries(): Promise<SitemapEntry[]> {
  const payload = await getPayloadClient();
  const entries: SitemapEntry[] = [];
  let page = 1;

  for (;;) {
    const result = await payload.find({
      collection: 'properties',
      where: publicStatusWhere(),
      depth: 0,
      limit: SITEMAP_PAGE_SIZE,
      page,
      overrideAccess: false,
      select: { slug: true, updatedAt: true },
      sort: 'id',
    });

    for (const doc of result.docs) {
      const slug = typeof doc.slug === 'string' ? doc.slug.trim() : '';
      if (!slug) {
        continue;
      }

      entries.push({
        slug,
        updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
      });
    }

    if (!result.hasNextPage) {
      return entries;
    }

    page += 1;
  }
}
