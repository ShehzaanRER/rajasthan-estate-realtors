import type { Where } from 'payload';
import type { WebsiteBanner } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { BANNER_DEFAULTS } from './defaults';
import { mapWebsiteBanner } from './mapWebsiteBanner';
import { PROPERTIES_VARIANTS, type BannerPlacement } from './placements';
import type { PublicWebsiteBanner, ResolvedBanner } from './types';

export type BannerRecords = Partial<Record<BannerPlacement, PublicWebsiteBanner>>;

/** Enough to populate the two Media uploads, and no deeper. */
const BANNER_DEPTH = 1;

/** Published, enabled records for these placements — nothing else. */
export function bannerWhere(placements: readonly BannerPlacement[]): Where {
  return {
    and: [
      { placement: { in: [...placements] } },
      { _status: { equals: 'published' } },
      { enabled: { equals: true } },
    ],
  };
}

/**
 * One record per placement, chosen deterministically.
 *
 * The unique index on `placement` means a query cannot return two today. If
 * it ever did (the index dropped, a restore from an older dump) the most
 * recently updated record wins — `docs` arrive sorted `-updatedAt`, then `-id`
 * — never whichever row the database happened to return first.
 */
export function selectBanners(docs: WebsiteBanner[]): BannerRecords {
  const records: BannerRecords = {};

  for (const doc of docs) {
    const banner = mapWebsiteBanner(doc);

    if (banner && !records[banner.placement]) {
      records[banner.placement] = banner;
    }
  }

  return records;
}

type FindBanners = (placements: readonly BannerPlacement[]) => Promise<WebsiteBanner[]>;

const findBannersWithPayload: FindBanners = async (placements) => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'website-banners',
    where: bannerWhere(placements),
    depth: BANNER_DEPTH,
    draft: false,
    limit: placements.length * 2,
    pagination: false,
    overrideAccess: false,
    sort: ['-updatedAt', '-id'],
  });

  return result.docs as WebsiteBanner[];
};

/**
 * The eligible CMS records for a set of placements, in one query.
 *
 * A failed read degrades to "no records" — every placement then renders its
 * built-in design — rather than taking the page down with it. The case that
 * matters is a deployment whose database has not received the
 * `website_banners` table yet; a banner is never worth a 500 on the homepage.
 * The error is still logged.
 */
export async function getWebsiteBanners(
  placements: readonly BannerPlacement[],
  find: FindBanners = findBannersWithPayload,
): Promise<BannerRecords> {
  if (placements.length === 0) {
    return {};
  }

  try {
    return selectBanners(await find(placements));
  } catch (error) {
    // Drizzle wraps the driver error as "Failed query: ..."; the cause is the
    // part that says what actually went wrong.
    const cause = (error as { cause?: { message?: string } })?.cause?.message;
    console.error(
      `[website-banners] could not load banners; using built-in designs.${cause ? ` Cause: ${cause}` : ''}`,
      error,
    );
    return {};
  }
}

function fromDefaults(placement: BannerPlacement): ResolvedBanner {
  return { placement, ...BANNER_DEFAULTS[placement], source: 'default' };
}

function isPropertiesVariant(
  placement: BannerPlacement,
): placement is (typeof PROPERTIES_VARIANTS)[number] {
  return (PROPERTIES_VARIANTS as readonly string[]).includes(placement);
}

/** Which records `resolveBanner()` may need for a placement. */
export function placementsFor(placement: BannerPlacement): BannerPlacement[] {
  return isPropertiesVariant(placement) ? [placement, 'properties'] : [placement];
}

/**
 * What a placement renders, given the records that exist.
 *
 * 1. Its own published, enabled record.
 * 2. For the /properties filter variants (`rentals`, `commercial`) only: the
 *    general `properties` record. A variant record with no photograph of its
 *    own also borrows the `properties` photograph, keeping its own text.
 * 3. Otherwise the built-in design from `BANNER_DEFAULTS` — never another
 *    page's photograph.
 */
export function resolveBanner(placement: BannerPlacement, records: BannerRecords): ResolvedBanner {
  const own = records[placement];
  const general = isPropertiesVariant(placement) ? records.properties : undefined;

  if (own) {
    const image = own.image ?? general?.image ?? null;
    return { ...own, image, source: 'cms' };
  }

  if (general) {
    return { ...general, placement, source: 'cms' };
  }

  return fromDefaults(placement);
}

/** The banner for one placement. */
export async function getBanner(placement: BannerPlacement): Promise<ResolvedBanner> {
  return resolveBanner(placement, await getWebsiteBanners(placementsFor(placement)));
}

/** The homepage's two independent placements, in one query. */
export async function getHomeBanners(): Promise<{
  hero: ResolvedBanner;
  ourStory: ResolvedBanner;
}> {
  const records = await getWebsiteBanners(['home', 'our-story']);

  return {
    hero: resolveBanner('home', records),
    ourStory: resolveBanner('our-story', records),
  };
}
