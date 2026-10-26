import type { Listing } from '../../payload-types';
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

function latest(a: string | null, b: string | null): string | null {
  if (!a) {
    return b;
  }

  if (!b) {
    return a;
  }

  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

/**
 * Every public LISTING, for `app/sitemap.ts`: each listing is its own page and
 * its own canonical URL, so a flat for sale and for rent contributes two
 * entries, each with its own `lastModified`.
 *
 * Deliberately a separate query from `getProperties()`: a sitemap has to be
 * exhaustive, a listing page bounded and fast (see the 101st-property note in
 * the project history). Visibility is unchanged and not reimplemented —
 * `publicStatusWhere()` plus `overrideAccess: false`, so drafts, withdrawn and
 * closed listings stay out.
 *
 * `lastModified` is the later of the listing's and its property's `updatedAt`:
 * new photographs or a corrected specification change the page just as a price
 * change does. A listing whose property is not readable to a visitor is
 * skipped, matching what the page itself would render.
 */
export async function getPropertySitemapEntries(): Promise<SitemapEntry[]> {
  const payload = await getPayloadClient();
  const entries: SitemapEntry[] = [];
  let page = 1;

  for (;;) {
    const result = await payload.find({
      collection: 'listings',
      where: publicStatusWhere(),
      depth: 1,
      limit: SITEMAP_PAGE_SIZE,
      page,
      overrideAccess: false,
      select: { slug: true, updatedAt: true, property: true },
      sort: 'id',
    });

    for (const doc of result.docs as Listing[]) {
      const slug = typeof doc.slug === 'string' ? doc.slug.trim() : '';
      const property = typeof doc.property === 'object' ? doc.property : null;
      if (!slug || !property) {
        continue;
      }

      entries.push({
        slug,
        updatedAt: latest(
          typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
          typeof property.updatedAt === 'string' ? property.updatedAt : null,
        ),
      });
    }

    if (!result.hasNextPage) {
      return entries;
    }

    page += 1;
  }
}
