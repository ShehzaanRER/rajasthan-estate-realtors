import { Gutter } from '@payloadcms/ui';
import type { Payload, TypedUser } from 'payload';
import type { ConsoleNavGroup, ConsolePermissions } from '../../../lib/admin-console';
import { collectionListUrl, loadConsoleData } from '../../../lib/admin-console';
import { ConsoleAttention } from './ConsoleAttention';
import { ConsoleCollections } from './ConsoleCollections';
import { ConsoleOverview } from './ConsoleOverview';
import { ConsoleQuickActions } from './ConsoleQuickActions';
import { ConsoleRecent } from './ConsoleRecent';
import { ConsoleRenewals } from './ConsoleRenewals';

/**
 * Payload hands the dashboard view a wide set of server props (see
 * `DashboardView` in @payloadcms/next); these are the four the console reads.
 */
type RerConsoleViewProps = {
  navGroups?: ConsoleNavGroup[];
  payload: Payload;
  permissions?: ConsolePermissions;
  user?: TypedUser | null;
};

/** Prefers the user's name, falls back to their email, then to nothing. */
function describeUser(user: TypedUser | null | undefined): string | null {
  if (!user) {
    return null;
  }

  const { email, name } = user as { email?: unknown; name?: unknown };

  if (typeof name === 'string' && name.trim().length > 0) {
    return name;
  }

  return typeof email === 'string' && email.length > 0 ? email : null;
}

/**
 * The RER Property Management Console — the admin panel's landing page.
 *
 * Registered as `admin.components.views.dashboard` in payload.config.ts,
 * which replaces only the *body* of `/admin`: Payload's own DashboardView
 * still wraps this in HydrateAuthProvider and SetStepNav, and the nav rail,
 * account menu and every collection route are untouched.
 *
 * Everything rendered here is a live read of the existing Payload/Postgres
 * data through the Local API. There is no second database, no cached
 * snapshot, no activity log and no derived metric that the schema cannot
 * answer exactly — see lib/admin-console/ for how each figure is produced.
 *
 * This is a server component and ships no client JavaScript of its own; the
 * only client boundary is Payload's own `Gutter`, which is what the default
 * dashboard uses for page padding.
 */
export async function RerConsoleView({ navGroups, payload, permissions, user }: RerConsoleViewProps) {
  const adminRoute = payload.config.routes.admin;

  const data = await loadConsoleData({
    adminRoute,
    navGroups: navGroups ?? [],
    payload,
    permissions,
    user,
  });

  const signedInAs = describeUser(user);

  return (
    <Gutter className="rer-console">
      <header className="rer-console__header">
        <div>
          <p className="rer-console__eyebrow">Rajasthan Estate Realtors</p>
          <h1 className="rer-console__title">Property Management Console</h1>
        </div>
        {signedInAs ? <p className="rer-console__signed-in">Signed in as {signedInAs}</p> : null}
      </header>

      <ConsoleQuickActions actions={data.quickActions} />

      <ConsoleOverview groups={data.groups} library={data.library} />

      <div className="rer-console__split">
        <ConsoleAttention clearChecks={data.clearChecks} issues={data.attention} />
        <ConsoleRenewals href={data.renewalsHref} rows={data.renewals} total={data.renewalsTotal} />
      </div>

      <div className="rer-console__split">
        <ConsoleRecent
          action={{ href: collectionListUrl(adminRoute, 'properties'), label: 'All properties' }}
          records={data.recentProperties}
          title="Recently updated properties"
        />
        <ConsoleRecent
          action={{ href: collectionListUrl(adminRoute, 'listings'), label: 'All listings' }}
          records={data.recentListings}
          title="Recently updated listings"
        />
      </div>

      <div className="rer-console__split">
        <ConsoleRecent
          action={{ href: collectionListUrl(adminRoute, 'projects'), label: 'All projects' }}
          records={data.recentProjects}
          title="Recently updated projects"
        />
      </div>

      <ConsoleCollections groups={data.collectionGroups} />
    </Gutter>
  );
}

export default RerConsoleView;
