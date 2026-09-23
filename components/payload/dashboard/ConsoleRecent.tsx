import Link from 'next/link';
import type { RecentRecord } from '../../../lib/admin-console';
import { ConsolePanel } from './ConsolePanel';
import { ConsoleStatus } from './ConsoleStatus';

function formatUpdatedAt(value: string): string {
  const updated = new Date(value);

  if (Number.isNaN(updated.getTime())) {
    return value;
  }

  return updated.toLocaleString('en-IN', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  });
}

/**
 * Real recent activity, read from the existing `updatedAt` column — there is
 * no separate activity log and none is introduced.
 *
 * Properties and Projects get their own panel rather than one merged feed:
 * they are separate concepts with separate status vocabularies, and merging
 * them would need a "type" column to be readable at all.
 */
export function ConsoleRecent({
  action,
  records,
  title,
}: {
  action: { href: string; label: string };
  records: RecentRecord[];
  title: string;
}) {
  return (
    <ConsolePanel action={action} title={title}>
      {records.length === 0 ? (
        <p className="rer-console__empty">Nothing recorded yet.</p>
      ) : (
        <ul className="rer-console__rows">
          {records.map((record) => (
            <li key={record.id}>
              <Link className="rer-console__row" href={record.href}>
                <span className="rer-console__row-id">{record.rerId}</span>
                <span className="rer-console__row-body">
                  <span className="rer-console__row-title">{record.title}</span>
                  <span className="rer-console__row-sub">{record.location}</span>
                </span>
                <ConsoleStatus label={record.statusLabel} value={record.status} />
                <span className="rer-console__row-time">{formatUpdatedAt(record.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ConsolePanel>
  );
}

export default ConsoleRecent;
