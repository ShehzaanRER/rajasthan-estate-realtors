/**
 * Website Banners — collections/WebsiteBanners.ts and lib/website-banners/.
 *
 * Pure tests: the Local API is replaced by a fake `find`, so nothing here
 * touches a database.
 *
 * Run:  npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  WebsiteBanners,
  isAuthenticated,
  placementUpdateAccess,
  readPublishedEnabledBanners,
} from '../collections/WebsiteBanners';
import { bannerPathsToRevalidate } from '../collections/hooks/revalidateWebsiteBanner';
import { BANNER_DEFAULTS } from '../lib/website-banners/defaults';
import {
  bannerWhere,
  getWebsiteBanners,
  placementsFor,
  resolveBanner,
  selectBanners,
} from '../lib/website-banners/getWebsiteBanners';
import { safeBannerHref } from '../lib/website-banners/links';
import { mapWebsiteBanner } from '../lib/website-banners/mapWebsiteBanner';
import {
  BANNER_PLACEMENT_VALUES,
  propertiesBannerPlacement,
  type BannerPlacement,
} from '../lib/website-banners/placements';
import { placementsToSeed, seedRecordFor } from '../lib/website-banners/seed';
import type { Media, WebsiteBanner } from '../payload-types';

// --- fixtures ----------------------------------------------------------------

let nextId = 1;

function media(name: string, overrides: Partial<Media> = {}): Media {
  return {
    id: nextId++,
    alt: `${name} photograph`,
    url: `/api/media/file/${name}.jpg`,
    mimeType: 'image/jpeg',
    width: 6000,
    height: 4000,
    sizes: {
      large: {
        url: `/api/media/file/${name}-4096x2731.webp`,
        mimeType: 'image/webp',
        width: 4096,
        height: 2731,
      },
    },
    updatedAt: '2026-10-01T00:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  } as Media;
}

function banner(overrides: Partial<WebsiteBanner> = {}): WebsiteBanner {
  return {
    id: nextId++,
    name: 'About Us page',
    placement: 'about',
    enabled: true,
    _status: 'published',
    desktopImage: media('about-desktop'),
    mobileImage: null,
    desktopPosition: 'center',
    heading: 'Rajasthan Estate Realtors,',
    headingAccent: 'Jogeshwari since 1988.',
    description: 'Built on trust.',
    overlay: 'standard',
    textAlign: 'left',
    showCta: false,
    updatedAt: '2026-10-20T00:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  } as WebsiteBanner;
}

/** A `find` that returns `docs` and records the placements it was asked for. */
function fakeFind(docs: WebsiteBanner[], calls: (readonly BannerPlacement[])[] = []) {
  return async (placements: readonly BannerPlacement[]) => {
    calls.push(placements);
    return docs;
  };
}

type AnyField = { name?: string; type?: string; fields?: AnyField[]; tabs?: { fields: AnyField[] }[] } & Record<
  string,
  unknown
>;

function findField(fields: AnyField[], name: string): AnyField | undefined {
  for (const field of fields) {
    if (field.name === name) return field;
    const nested = [...(field.fields ?? []), ...(field.tabs ?? []).flatMap((tab) => tab.fields)];
    const found = nested.length ? findField(nested, name) : undefined;
    if (found) return found;
  }
  return undefined;
}

const field = (name: string) => findField(WebsiteBanners.fields as AnyField[], name)!;

// --- 1-3. retrieval, disabled, drafts ----------------------------------------

describe('getWebsiteBanners', () => {
  it('returns a published, enabled banner for its placement', async () => {
    const records = await getWebsiteBanners(['about'], fakeFind([banner()]));
    assert.equal(records.about?.heading, 'Rajasthan Estate Realtors,');
    assert.equal(records.about?.image?.src, '/api/media/file/about-desktop-4096x2731.webp');
  });

  it('queries only published, enabled records for the requested placements', () => {
    assert.deepEqual(bannerWhere(['home', 'our-story']), {
      and: [
        { placement: { in: ['home', 'our-story'] } },
        { _status: { equals: 'published' } },
        { enabled: { equals: true } },
      ],
    });
  });

  it('excludes a disabled banner even if a query returns it', async () => {
    const records = await getWebsiteBanners(['about'], fakeFind([banner({ enabled: false })]));
    assert.equal(records.about, undefined);
  });

  it('excludes an unpublished draft even if a query returns it', async () => {
    const records = await getWebsiteBanners(['about'], fakeFind([banner({ _status: 'draft' })]));
    assert.equal(records.about, undefined);
  });

  it('degrades to no records when the read fails', async () => {
    const originalError = console.error;
    console.error = () => {};
    try {
      const records = await getWebsiteBanners(['about'], async () => {
        throw new Error('relation "website_banners" does not exist');
      });
      assert.deepEqual(records, {});
    } finally {
      console.error = originalError;
    }
  });
});

// --- 4. placement selection ----------------------------------------------------

describe('placement selection', () => {
  it('keeps one record per placement, the most recently updated winning', () => {
    // Docs arrive sorted -updatedAt; the first per placement must win.
    const newer = banner({ heading: 'Newer', updatedAt: '2026-10-21T00:00:00.000Z' });
    const older = banner({ heading: 'Older', updatedAt: '2026-10-01T00:00:00.000Z' });
    assert.equal(selectBanners([newer, older]).about?.heading, 'Newer');
  });

  it('never gives a page another page’s banner', () => {
    const records = selectBanners([banner({ placement: 'contact' })]);
    const about = resolveBanner('about', records);
    assert.equal(about.source, 'default');
    assert.equal(about.image, null);
    assert.equal(about.heading, BANNER_DEFAULTS.about.heading);
  });

  it('keeps the homepage hero and Our Story image independent', () => {
    const records = selectBanners([
      banner({ placement: 'home', heading: 'Find your place', desktopImage: media('hero') }),
    ]);
    assert.equal(resolveBanner('home', records).image?.src, '/api/media/file/hero-4096x2731.webp');
    assert.equal(resolveBanner('our-story', records).source, 'default');
    assert.equal(resolveBanner('our-story', records).image, null);
  });

  it('drops text fields the Our Story placement does not use', () => {
    const story = mapWebsiteBanner(
      banner({ placement: 'our-story', heading: 'Stray heading', imageAlt: 'The RER office' }),
    );
    assert.equal(story?.heading, null);
    assert.equal(story?.cta, null);
    assert.equal(story?.image?.alt, 'The RER office');
  });
});

// --- 5-6. images and missing content -----------------------------------------

describe('banner images', () => {
  it('uses the desktop image at every breakpoint when no mobile image exists', () => {
    const mapped = mapWebsiteBanner(banner({ desktopPosition: 'left top', mobilePosition: null }));
    assert.equal(mapped?.image?.mobileSrc, null);
    assert.equal(mapped?.image?.position, 'left top');
    assert.equal(mapped?.image?.mobilePosition, 'left top');
  });

  it('adds the mobile crop when one is set', () => {
    const mapped = mapWebsiteBanner(
      banner({ mobileImage: media('about-mobile'), mobilePosition: 'right' }),
    );
    assert.equal(mapped?.image?.mobileSrc, '/api/media/file/about-mobile-4096x2731.webp');
    assert.equal(mapped?.image?.mobilePosition, 'right');
  });

  it('falls back to the original upload when there is no usable derivative', () => {
    const mapped = mapWebsiteBanner(banner({ desktopImage: media('old', { sizes: {} }) }));
    assert.equal(mapped?.image?.src, '/api/media/file/old.jpg');
  });

  it('treats an unpopulated, deleted, URL-less or SVG image as no image', () => {
    for (const desktopImage of [
      42,
      null,
      undefined,
      media('broken', { url: '' }),
      media('logo', { mimeType: 'image/svg+xml' }),
    ]) {
      assert.equal(mapWebsiteBanner(banner({ desktopImage } as Partial<WebsiteBanner>))?.image, null);
    }
  });

  it('never promotes a mobile crop to the desktop image', () => {
    const mapped = mapWebsiteBanner(banner({ desktopImage: null, mobileImage: media('m') }));
    assert.equal(mapped?.image, null);
  });

  it('falls back to centre for an unknown stored position', () => {
    const mapped = mapWebsiteBanner(banner({ desktopPosition: 'sideways' as never }));
    assert.equal(mapped?.image?.position, 'center');
  });

  it('renders the built-in design for a placement with no record', () => {
    for (const placement of BANNER_PLACEMENT_VALUES) {
      const resolved = resolveBanner(placement, {});
      assert.equal(resolved.source, 'default');
      assert.equal(resolved.image, null);
      assert.equal(resolved.heading, BANNER_DEFAULTS[placement].heading);
    }
  });

  it('keeps the hero’s built-in button for the no-record case', () => {
    assert.deepEqual(resolveBanner('home', {}).cta, { label: 'Explore Properties', href: '/properties' });
  });
});

// --- 7. /properties filter variants ------------------------------------------

describe('properties banner selection', () => {
  it('maps filters to placements, commercial winning over rent', () => {
    assert.equal(propertiesBannerPlacement({}), 'properties');
    assert.equal(propertiesBannerPlacement({ purpose: 'buy' }), 'properties');
    assert.equal(propertiesBannerPlacement({ category: 'residential' }), 'properties');
    assert.equal(propertiesBannerPlacement({ purpose: 'rent' }), 'rentals');
    assert.equal(propertiesBannerPlacement({ purpose: 'lease' }), 'rentals');
    assert.equal(propertiesBannerPlacement({ category: 'commercial' }), 'commercial');
    assert.equal(propertiesBannerPlacement({ category: 'commercial', purpose: 'rent' }), 'commercial');
  });

  it('fetches the general properties record alongside a variant', () => {
    assert.deepEqual(placementsFor('rentals'), ['rentals', 'properties']);
    assert.deepEqual(placementsFor('commercial'), ['commercial', 'properties']);
    assert.deepEqual(placementsFor('properties'), ['properties']);
  });

  const general = banner({
    placement: 'properties',
    heading: 'Properties',
    desktopImage: media('properties'),
  });

  it('uses a variant’s own record when it has one', () => {
    const rentals = banner({ placement: 'rentals', heading: 'Rentals', desktopImage: media('rentals') });
    const resolved = resolveBanner('rentals', selectBanners([rentals, general]));
    assert.equal(resolved.heading, 'Rentals');
    assert.equal(resolved.image?.src, '/api/media/file/rentals-4096x2731.webp');
  });

  it('falls back to the general properties record for a variant without one', () => {
    const resolved = resolveBanner('commercial', selectBanners([general]));
    assert.equal(resolved.source, 'cms');
    assert.equal(resolved.placement, 'commercial');
    assert.equal(resolved.heading, 'Properties');
  });

  it('lends the general photograph to a variant record that has none', () => {
    const rentals = banner({ placement: 'rentals', heading: 'Rentals', desktopImage: null });
    const resolved = resolveBanner('rentals', selectBanners([rentals, general]));
    assert.equal(resolved.heading, 'Rentals');
    assert.equal(resolved.image?.src, '/api/media/file/properties-4096x2731.webp');
  });

  it('shows the built-in header when neither record exists', () => {
    assert.equal(resolveBanner('rentals', {}).source, 'default');
  });
});

// --- 8. access control --------------------------------------------------------

describe('access control', () => {
  const asStaff = { req: { user: { id: 1 } } } as never;
  const asVisitor = { req: { user: null } } as never;

  it('lets staff read everything, drafts included', () => {
    assert.equal(readPublishedEnabledBanners(asStaff), true);
  });

  it('constrains public reads to published, enabled records', () => {
    assert.deepEqual(readPublishedEnabledBanners(asVisitor), {
      and: [{ _status: { equals: 'published' } }, { enabled: { equals: true } }],
    });
  });

  it('allows create, update, delete and version reads only when signed in', () => {
    const { access } = WebsiteBanners;
    for (const operation of ['create', 'update', 'delete', 'readVersions'] as const) {
      assert.equal(access?.[operation], isAuthenticated, operation);
    }
    assert.equal(isAuthenticated(asStaff), true);
    assert.equal(isAuthenticated(asVisitor), false);
  });

  it('hides internal notes from the public', () => {
    const notesRead = (field('internalNotes').access as { read: (args: unknown) => boolean }).read;
    assert.equal(notesRead(asStaff), true);
    assert.equal(notesRead(asVisitor), false);
  });

  it('locks the placement once a record has one', () => {
    assert.equal(placementUpdateAccess({ doc: { placement: 'home' } } as never), false);
    assert.equal(placementUpdateAccess({ doc: { placement: null } } as never), true);
  });

  it('enforces one record per placement in the database', () => {
    assert.equal(field('placement').unique, true);
    assert.equal(WebsiteBanners.disableDuplicate, true);
  });

  it('uses Payload drafts', () => {
    assert.equal((WebsiteBanners.versions as { drafts: unknown }).drafts, true);
  });
});

// --- validation ---------------------------------------------------------------

describe('validation', () => {
  type V = (value: unknown, args: Record<string, unknown>) => true | string;
  const validate = (name: string) => field(name).validate as V;

  it('accepts site paths, http(s), tel: and mailto: CTA links', () => {
    for (const href of [
      '/properties',
      '/properties?for=rent&category=commercial',
      '/contact#form',
      'https://wa.me/919892371329',
      'tel:+919892371329',
      'mailto:info@example.com',
    ]) {
      assert.equal(safeBannerHref(href), href, href);
    }
  });

  it('rejects unsafe or malformed CTA links', () => {
    for (const href of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html,hi',
      '//evil.example',
      '/\\evil.example',
      'properties',
      'ftp://example.com',
      'https://',
      '/a b',
      '',
      null,
    ]) {
      assert.equal(safeBannerHref(href), null, String(href));
    }
  });

  it('rejects a malformed CTA destination on save', () => {
    const ctaUrl = validate('ctaUrl');
    assert.equal(ctaUrl('/properties', { siblingData: { showCta: true } }), true);
    assert.equal(typeof ctaUrl('javascript:alert(1)', { siblingData: { showCta: true } }), 'string');
    assert.equal(typeof ctaUrl('', { siblingData: { showCta: true } }), 'string');
    assert.equal(ctaUrl('', { siblingData: { showCta: false } }), true);
  });

  it('requires button text only when the button is shown', () => {
    const ctaLabel = validate('ctaLabel');
    assert.equal(typeof ctaLabel('', { siblingData: { showCta: true } }), 'string');
    assert.equal(ctaLabel('', { siblingData: { showCta: false } }), true);
  });

  it('requires a desktop image for the hero and Our Story, not for page headers', () => {
    const desktopImage = validate('desktopImage');
    assert.equal(typeof desktopImage(null, { data: { placement: 'home' } }), 'string');
    assert.equal(typeof desktopImage(null, { data: { placement: 'our-story' } }), 'string');
    assert.equal(desktopImage(null, { data: { placement: 'about' } }), true);
    assert.equal(desktopImage(7, { data: { placement: 'home' } }), true);
  });

  it('requires a heading wherever the placement shows one', () => {
    const heading = validate('heading');
    assert.equal(typeof heading('  ', { data: { placement: 'contact' } }), 'string');
    assert.equal(heading('', { data: { placement: 'our-story' } }), true);
    assert.equal(heading('Let’s talk', { data: { placement: 'contact' } }), true);
  });

  it('drops a CTA whose stored link is unsafe', () => {
    const mapped = mapWebsiteBanner(
      banner({ showCta: true, ctaLabel: 'Click', ctaUrl: 'javascript:alert(1)' }),
    );
    assert.equal(mapped?.cta, null);
  });

  it('offers exactly the placements the site renders', () => {
    const options = (field('placement').options as { value: string }[]).map((option) => option.value);
    assert.deepEqual(options, [
      'home',
      'our-story',
      'properties',
      'rentals',
      'commercial',
      'projects',
      'about',
      'contact',
    ]);
  });
});

// --- revalidation -------------------------------------------------------------

describe('revalidation', () => {
  it('revalidates the placement’s page on publish', () => {
    assert.deepEqual(bannerPathsToRevalidate({ placement: 'home', _status: 'published' }), ['/']);
  });

  it('revalidates on unpublish', () => {
    assert.deepEqual(
      bannerPathsToRevalidate({ placement: 'about', _status: 'draft' }, { placement: 'about', _status: 'published' }),
      ['/about'],
    );
  });

  it('does nothing for a draft of a banner that was never live', () => {
    assert.deepEqual(
      bannerPathsToRevalidate({ placement: 'about', _status: 'draft' }, { placement: 'about', _status: 'draft' }),
      [],
    );
  });

  it('revalidates /properties once for any of its three placements', () => {
    assert.deepEqual(
      bannerPathsToRevalidate({ placement: 'rentals', _status: 'published' }, { placement: 'rentals', _status: 'published' }),
      ['/properties'],
    );
  });
});

// --- 9. seed ------------------------------------------------------------------

describe('seed', () => {
  it('seeds every placement on an empty collection', () => {
    assert.deepEqual(placementsToSeed([]), BANNER_PLACEMENT_VALUES);
  });

  it('is a no-op once every placement has a record, so it is safe to re-run', () => {
    assert.deepEqual(placementsToSeed(BANNER_PLACEMENT_VALUES), []);
  });

  it('skips placements that already have a record in any state', () => {
    assert.deepEqual(placementsToSeed(['home', 'about', null, 'unknown']), [
      'our-story',
      'properties',
      'rentals',
      'commercial',
      'projects',
      'contact',
    ]);
  });

  it('creates drafts with the live copy and no media relationships', () => {
    for (const placement of BANNER_PLACEMENT_VALUES) {
      const record = seedRecordFor(placement);
      assert.equal(record._status, 'draft');
      assert.equal(record.placement, placement);
      assert.equal(record.heading, BANNER_DEFAULTS[placement].heading);
      assert.ok(!('desktopImage' in record) && !('mobileImage' in record));
    }
  });

  it('seeds the hero with its existing button', () => {
    const hero = seedRecordFor('home');
    assert.equal(hero.showCta, true);
    assert.equal(hero.ctaLabel, 'Explore Properties');
    assert.equal(hero.ctaUrl, '/properties');
  });

  it('seeds nothing a draft would show as an unvalidated live banner', () => {
    // A seeded record maps to nothing until it is published.
    const asStored = { ...seedRecordFor('about'), id: 1 } as unknown as WebsiteBanner;
    assert.equal(mapWebsiteBanner(asStored), null);
  });
});
