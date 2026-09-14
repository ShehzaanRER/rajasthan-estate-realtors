import type { MetadataRoute } from 'next';
import { getProjectSitemapEntries } from '../lib/projects/getSitemapEntries';
import { getPropertySitemapEntries } from '../lib/properties/getSitemapEntries';
import { SITE_URL } from '../lib/siteConfig';

/**
 * Only canonical, indexable URLs. No filter parameter combinations: every
 * `/properties?...` variant canonicalises to `/properties`, so listing them
 * here would contradict the canonical tags. `/privacy-policy` and `/terms` are
 * excluded because both carry `robots: { index: false }`.
 *
 * `changeFrequency` and `priority` are deliberately absent — Google ignores
 * both. `lastModified` is the field it actually uses, and for this site it is
 * the one that matters: a price change or a status change needs to be picked up
 * promptly, not on the crawler's own schedule.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, projects] = await Promise.all([
    getPropertySitemapEntries(),
    getProjectSitemapEntries(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/properties` },
    { url: `${SITE_URL}/projects` },
    { url: `${SITE_URL}/about` },
    { url: `${SITE_URL}/contact` },
  ];

  const propertyRoutes: MetadataRoute.Sitemap = properties.map((entry) => ({
    url: `${SITE_URL}/properties/${entry.slug}`,
    lastModified: entry.updatedAt ?? undefined,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((entry) => ({
    url: `${SITE_URL}/projects/${entry.slug}`,
    lastModified: entry.updatedAt ?? undefined,
  }));

  return [...staticRoutes, ...propertyRoutes, ...projectRoutes];
}
