import { getPayloadClient } from '../payload';
import type { SitemapEntry } from '../properties/getSitemapEntries';
import { publicProjectStatusWhere } from './publicScope';

const SITEMAP_PAGE_SIZE = 500;

/**
 * Every published project, for `app/sitemap.ts`. The projects counterpart of
 * `getPropertySitemapEntries()` — see the reasoning there; the same 100-record
 * ceiling applied here through `PUBLIC_PROJECT_LIMIT`.
 *
 * Visibility comes from `publicProjectStatusWhere()`, so every status except
 * `draft` is included, matching the public routes.
 */
export async function getProjectSitemapEntries(): Promise<SitemapEntry[]> {
  const payload = await getPayloadClient();
  const entries: SitemapEntry[] = [];
  let page = 1;

  for (;;) {
    const result = await payload.find({
      collection: 'projects',
      where: publicProjectStatusWhere(),
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
