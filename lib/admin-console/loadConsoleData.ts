import type { Payload, TypedUser, Where } from 'payload';
import { describeAgreementCountdown } from '../properties/agreementCountdown';
import { PUBLIC_PROJECT_STATUSES } from '../projects/publicScope';
import { PUBLIC_LISTING_STATUSES, TRANSACTION_TYPE_LABELS, TRANSACTION_TYPES } from '../listings/vocabulary';
import { PUBLIC_STATUSES } from '../properties/publicScope';
import { collectionCreateUrl, collectionListUrl, documentUrl } from './adminUrls';
import { ATTENTION_CHECKS } from './checks';
import { getSelectOptions, labelForValue } from './selectOptions';
import type {
  AttentionIssue,
  CollectionGroup,
  ConsoleData,
  ConsoleMetric,
  ConsoleNavGroup,
  ConsolePermissions,
  MetricGroup,
  QuickAction,
  RecentRecord,
  RenewalRow,
} from './types';

export type LoadConsoleDataArgs = {
  adminRoute: string;
  navGroups: ConsoleNavGroup[];
  payload: Payload;
  permissions: ConsolePermissions | undefined;
  user: TypedUser | null | undefined;
};

/** How many rows each list panel shows before deferring to the full list view. */
const RECENT_LIMIT = 6;
const RENEWAL_LIMIT = 6;

function canCreate(permissions: ConsolePermissions | undefined, slug: string): boolean {
  return permissions?.collections?.[slug]?.create === true;
}

function joinLocation(location: unknown): string {
  if (location === null || typeof location !== 'object') {
    return '—';
  }

  const { area, city, locality } = location as Record<string, unknown>;
  const parts = [locality, area, city].filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0,
  );

  // `locality` and `city` are both required, so the only realistic duplicate
  // is a record whose area repeats its locality.
  const unique = parts.filter((part, index) => parts.indexOf(part) === index);

  return unique.length > 0 ? unique.join(', ') : '—';
}

export async function loadConsoleData({
  adminRoute,
  navGroups,
  payload,
  permissions,
  user,
}: LoadConsoleDataArgs): Promise<ConsoleData> {
  const queryArgs = { overrideAccess: false, user } as const;

  const propertyStatuses = getSelectOptions(payload, 'properties', 'status');
  const listingStatuses = getSelectOptions(payload, 'listings', 'status');
  const projectStatuses = getSelectOptions(payload, 'projects', 'status');

  /**
   * Every tile and every check is one `count()` over the same `Where` its
   * link navigates to, so a number and the list it opens can never drift
   * apart. They all run inside a single `Promise.all` — at RER's scale these
   * are trivial counts, and the alternative (deriving every figure from one
   * fetched page of documents) would silently go wrong the moment a
   * collection outgrew that page.
   */
  const countMetric = async (
    key: string,
    label: string,
    collection: 'projects' | 'properties' | 'listings',
    where: Where | null,
    emphasis?: boolean,
  ): Promise<ConsoleMetric> => {
    const result = await payload.count({
      collection,
      ...(where ? { where } : {}),
      ...queryArgs,
    });

    return {
      count: result.totalDocs,
      emphasis,
      href: collectionListUrl(adminRoute, collection, where ? { where } : undefined),
      key,
      label,
    };
  };

  const buildGroup = async (
    collection: 'projects' | 'properties' | 'listings',
    title: string,
    statuses: { label: string; value: string }[],
    publicStatuses: readonly string[],
    extra: Promise<ConsoleMetric>[] = [],
  ): Promise<MetricGroup> => {
    const metrics = await Promise.all([
      countMetric(`${collection}-total`, 'Total', collection, null, true),
      countMetric(
        `${collection}-live`,
        'Live on site',
        collection,
        { status: { in: [...publicStatuses] } },
        true,
      ),
      ...extra,
      ...statuses.map((status) =>
        countMetric(`${collection}-${status.value}`, status.label, collection, {
          status: { equals: status.value },
        }),
      ),
    ]);

    return {
      href: collectionListUrl(adminRoute, collection),
      key: collection,
      metrics,
      title,
    };
  };

  const libraryMetric = async (
    key: string,
    label: string,
    collection: string,
    where?: Where,
  ): Promise<ConsoleMetric> => {
    const result = await payload.count({
      collection: collection as 'media',
      ...(where ? { where } : {}),
      ...queryArgs,
    });

    return {
      count: result.totalDocs,
      href: collectionListUrl(adminRoute, collection, where ? { where } : undefined),
      key,
      label,
    };
  };

  // Tenancies are tracked through `isTenanted`, not `status`: a property can be
  // for sale (status Available) while a tenant is in place, and its renewal
  // must not disappear from the list because of that.
  const rentedWithEndDate: Where = {
    and: [{ isTenanted: { equals: true } }, { currentAgreementEndDate: { exists: true } }],
  };

  const [
    propertyGroup,
    listingGroup,
    projectGroup,
    library,
    checkCounts,
    recentPropertyDocs,
    recentListingDocs,
    recentProjectDocs,
    renewalDocs,
    renewalsCount,
  ] = await Promise.all([
    // Properties are counted once however many listings they have; "Live on
    // site" means at least one live listing (the property's roll-up status).
    buildGroup('properties', 'Properties', propertyStatuses, PUBLIC_STATUSES),
    // Listings count individual transactions. The live sale / rent / lease split
    // is the question this group exists to answer.
    buildGroup(
      'listings',
      'Listings',
      listingStatuses,
      PUBLIC_LISTING_STATUSES,
      TRANSACTION_TYPES.map((type) =>
        countMetric(
          `listings-live-${type}`,
          `Live · ${TRANSACTION_TYPE_LABELS[type]}`,
          'listings',
          {
            and: [{ status: { in: [...PUBLIC_LISTING_STATUSES] } }, { transactionType: { equals: type } }],
          },
        ),
      ),
    ),
    buildGroup('projects', 'Projects', projectStatuses, PUBLIC_PROJECT_STATUSES),
    Promise.all([
      libraryMetric('inquiries-new', 'New enquiries', 'contact-inquiries', { status: { equals: 'new' } }),
      libraryMetric('inquiries-total', 'Enquiries, all time', 'contact-inquiries'),
      libraryMetric('media', 'Media files', 'media'),
      libraryMetric('partners-active', 'Partners on site', 'channel-partners', { active: { equals: true } }),
      libraryMetric('partners-total', 'Partners on record', 'channel-partners'),
      libraryMetric('amenities', 'Amenities', 'amenities'),
    ]),
    Promise.all(
      ATTENTION_CHECKS.map(async (check): Promise<AttentionIssue> => {
        const result = await payload.count({
          collection: check.collection,
          where: check.where,
          ...queryArgs,
        });

        return {
          ...check,
          count: result.totalDocs,
          href: collectionListUrl(adminRoute, check.collection, { where: check.where }),
        };
      }),
    ),
    payload.find({
      collection: 'properties',
      depth: 0,
      limit: RECENT_LIMIT,
      select: { location: true, propertyId: true, status: true, title: true, updatedAt: true },
      sort: '-updatedAt',
      ...queryArgs,
    }),
    payload.find({
      collection: 'listings',
      depth: 1,
      limit: RECENT_LIMIT,
      select: { listingId: true, property: true, status: true, transactionType: true, updatedAt: true },
      sort: '-updatedAt',
      ...queryArgs,
    }),
    payload.find({
      collection: 'projects',
      depth: 0,
      limit: RECENT_LIMIT,
      select: { location: true, name: true, projectId: true, status: true, updatedAt: true },
      sort: '-updatedAt',
      ...queryArgs,
    }),
    payload.find({
      collection: 'properties',
      depth: 0,
      limit: RENEWAL_LIMIT,
      select: { currentAgreementEndDate: true, propertyId: true, rentHistory: true, title: true },
      // Soonest first, so an expired or imminent agreement is always the top row.
      sort: 'currentAgreementEndDate',
      where: rentedWithEndDate,
      ...queryArgs,
    }),
    payload.count({
      collection: 'properties',
      where: rentedWithEndDate,
      ...queryArgs,
    }),
  ]);

  const recentProperties: RecentRecord[] = recentPropertyDocs.docs.map((doc) => ({
    href: documentUrl(adminRoute, 'properties', doc.id),
    id: doc.id,
    location: joinLocation(doc.location),
    rerId: doc.propertyId || '—',
    status: doc.status || '',
    statusLabel: labelForValue(propertyStatuses, doc.status || ''),
    title: doc.title || '(untitled)',
    updatedAt: doc.updatedAt,
  }));

  const recentListings: RecentRecord[] = recentListingDocs.docs.map((doc) => {
    const property = typeof doc.property === 'object' && doc.property ? doc.property : null;
    const type = TRANSACTION_TYPES.find((candidate) => candidate === doc.transactionType);

    return {
      href: documentUrl(adminRoute, 'listings', doc.id),
      id: doc.id,
      location: property ? `${property.propertyId ?? '—'} · ${property.title ?? ''}`.trim() : '—',
      rerId: doc.listingId || '—',
      status: doc.status || '',
      statusLabel: labelForValue(listingStatuses, doc.status || ''),
      title: type ? `${TRANSACTION_TYPE_LABELS[type]} listing` : 'Listing',
      updatedAt: doc.updatedAt,
    };
  });

  const recentProjects: RecentRecord[] = recentProjectDocs.docs.map((doc) => ({
    href: documentUrl(adminRoute, 'projects', doc.id),
    id: doc.id,
    location: joinLocation(doc.location),
    rerId: doc.projectId || '—',
    status: doc.status || '',
    statusLabel: labelForValue(projectStatuses, doc.status || ''),
    title: doc.name || '(untitled)',
    updatedAt: doc.updatedAt,
  }));

  const renewals: RenewalRow[] = renewalDocs.docs.flatMap((doc): RenewalRow[] => {
    const endDate = typeof doc.currentAgreementEndDate === 'string' ? doc.currentAgreementEndDate : null;
    // Shared with the list-view Cell and the edit-page sidebar, so "urgent"
    // means the same thing in all three places.
    const countdown = describeAgreementCountdown(endDate);

    if (!endDate || !countdown) {
      return [];
    }

    // The LAST Tenancy History entry is the current one — see that array's
    // own admin description in collections/Properties.ts.
    const history = Array.isArray(doc.rentHistory) ? doc.rentHistory : [];
    const current = history[history.length - 1];

    return [
      {
        countdownLabel: countdown.label,
        endDate,
        href: documentUrl(adminRoute, 'properties', doc.id),
        id: doc.id,
        licensee: typeof current?.licenseeName === 'string' ? current.licenseeName : null,
        rerId: doc.propertyId || '—',
        tier: countdown.tier,
        title: doc.title || '(untitled)',
      },
    ];
  });

  const quickActions: QuickAction[] = [
    ...(canCreate(permissions, 'properties')
      ? [
          {
            href: collectionCreateUrl(adminRoute, 'properties'),
            key: 'add-property',
            label: 'Add property',
            primary: true,
          },
        ]
      : []),
    ...(canCreate(permissions, 'projects')
      ? [
          {
            href: collectionCreateUrl(adminRoute, 'projects'),
            key: 'add-project',
            label: 'Add project',
            primary: true,
          },
        ]
      : []),
    ...(canCreate(permissions, 'listings')
      ? [
          {
            href: collectionCreateUrl(adminRoute, 'listings'),
            key: 'add-listing',
            label: 'Add listing',
            primary: true,
          },
        ]
      : []),
    { href: collectionListUrl(adminRoute, 'properties'), key: 'view-properties', label: 'All properties' },
    { href: collectionListUrl(adminRoute, 'listings'), key: 'view-listings', label: 'All listings' },
    { href: collectionListUrl(adminRoute, 'projects'), key: 'view-projects', label: 'All projects' },
    { href: collectionListUrl(adminRoute, 'media'), key: 'media', label: 'Media library' },
    // The only import path that exists inside the admin. Bulk property import
    // is a CLI script (`npm run import:properties`), so there is deliberately
    // no button for it here.
    { href: `${adminRoute}/brochure-convert`, key: 'brochure-convert', label: 'Brochure convert' },
  ];

  const collectionGroups: CollectionGroup[] = navGroups
    .map((group) => ({
      entries: group.entities
        .filter((entity) => entity.type === 'collections')
        .map((entity) => ({
          createHref: canCreate(permissions, entity.slug) ? collectionCreateUrl(adminRoute, entity.slug) : null,
          href: collectionListUrl(adminRoute, entity.slug),
          label: typeof entity.label === 'string' ? entity.label : entity.slug,
          slug: entity.slug,
        })),
      label: group.label,
    }))
    .filter((group) => group.entries.length > 0);

  return {
    attention: checkCounts.filter((issue) => issue.count > 0),
    clearChecks: checkCounts.filter((issue) => issue.count === 0),
    collectionGroups,
    groups: [propertyGroup, listingGroup, projectGroup],
    library,
    quickActions,
    recentListings,
    recentProjects,
    recentProperties,
    renewals,
    renewalsHref: collectionListUrl(adminRoute, 'properties', {
      sort: 'currentAgreementEndDate',
      where: { isTenanted: { equals: true } },
    }),
    renewalsTotal: renewalsCount.totalDocs,
  };
}
