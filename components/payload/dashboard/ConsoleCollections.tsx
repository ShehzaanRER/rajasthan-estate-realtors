import Link from 'next/link';
import type { CollectionGroup } from '../../../lib/admin-console';
import { ConsolePanel } from './ConsolePanel';

/**
 * Replacing the dashboard view removes Payload's own collection-cards
 * widget, which is the only place in the admin that offers a direct "create"
 * link per collection alongside its list. This compact grid keeps that
 * affordance, built from the same permission-filtered `navGroups` the
 * navigation rail uses — so it shows exactly the collections this user can
 * read, grouped the way `admin.group` already groups them.
 */
export function ConsoleCollections({ groups }: { groups: CollectionGroup[] }) {
  return (
    <ConsolePanel title="All collections">
      <div className="rer-console__collections">
        {groups.map((group) => (
          <div className="rer-console__collection-group" key={group.label}>
            <p className="rer-console__eyebrow">{group.label}</p>
            <ul>
              {group.entries.map((entry) => (
                <li className="rer-console__collection" key={entry.slug}>
                  <Link className="rer-console__collection-link" href={entry.href}>
                    {entry.label}
                  </Link>
                  {entry.createHref ? (
                    <Link
                      aria-label={`Create ${entry.label}`}
                      className="rer-console__collection-create"
                      href={entry.createHref}
                    >
                      +
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ConsolePanel>
  );
}

export default ConsoleCollections;
