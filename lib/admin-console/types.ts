import type { Where } from 'payload';
import type { CountdownTier } from '../properties/agreementCountdown';

/**
 * The collections this console reports on. `properties` counts physical
 * properties, `listings` counts individual transactions on them (a flat for
 * sale and for rent is one property and two listings), `projects` counts
 * developments.
 */
export type ConsoleCollection = 'properties' | 'listings' | 'projects';

/**
 * Structural shape of the `navGroups` server prop Payload hands the dashboard
 * view. Declared here rather than imported because `@payloadcms/ui`'s own
 * `NavGroupType` is marked `@internal`.
 */
export type ConsoleNavGroup = {
  label: string;
  entities: { label: unknown; slug: string; type: string }[];
};

/**
 * The part of Payload's `SanitizedPermissions` the console reads. Its
 * `SanitizedCollectionPermission` sets `create` to literal `true` or omits it
 * entirely, so a missing key means "not allowed".
 */
export type ConsolePermissions = {
  collections?: Record<string, { create?: boolean } | undefined>;
};

/**
 * One number on the console. `where` is the single source of truth: it is
 * both what produced `count` and what `href` navigates the list view to, so
 * a tile and the list it opens can never disagree.
 */
export type ConsoleMetric = {
  key: string;
  label: string;
  count: number;
  href: string;
  /** `emphasis` renders as the group's headline figure. */
  emphasis?: boolean;
};

export type MetricGroup = {
  key: string;
  title: string;
  /** Unfiltered list route for the collection. */
  href: string;
  metrics: ConsoleMetric[];
};

/** A data-quality check: a `Where` that finds records missing something. */
export type AttentionCheck = {
  key: string;
  collection: ConsoleCollection;
  /** Reads as the issue, not the fix — e.g. "missing featured image". */
  label: string;
  /** Why it matters operationally. Shown as the row's second line. */
  detail: string;
  /**
   * `high` = the record is either publicly visible with the gap, or the gap
   * blocks tenancy/renewal tracking. `normal` = completeness, not urgency.
   */
  severity: 'high' | 'normal';
  where: Where;
};

export type AttentionIssue = AttentionCheck & {
  count: number;
  href: string;
};

export type RecentRecord = {
  id: number | string;
  rerId: string;
  title: string;
  location: string;
  status: string;
  statusLabel: string;
  updatedAt: string;
  href: string;
};

export type RenewalRow = {
  id: number | string;
  rerId: string;
  title: string;
  licensee: string | null;
  endDate: string;
  countdownLabel: string;
  tier: CountdownTier;
  href: string;
};

export type QuickAction = {
  key: string;
  label: string;
  href: string;
  /** Primary actions are the record-creating ones. */
  primary?: boolean;
};

export type CollectionLink = {
  slug: string;
  label: string;
  href: string;
  createHref: string | null;
};

export type CollectionGroup = {
  label: string;
  entries: CollectionLink[];
};

export type ConsoleData = {
  groups: MetricGroup[];
  library: ConsoleMetric[];
  quickActions: QuickAction[];
  attention: AttentionIssue[];
  clearChecks: AttentionIssue[];
  recentProperties: RecentRecord[];
  recentListings: RecentRecord[];
  recentProjects: RecentRecord[];
  renewals: RenewalRow[];
  /** Rented properties that have a calculable agreement end date. */
  renewalsTotal: number;
  renewalsHref: string;
  collectionGroups: CollectionGroup[];
};
