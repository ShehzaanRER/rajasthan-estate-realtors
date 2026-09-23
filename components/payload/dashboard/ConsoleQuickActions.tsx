import Link from 'next/link';
import type { QuickAction } from '../../../lib/admin-console';

/**
 * Every action here is an existing admin route. The two record-creating
 * actions are omitted entirely for a user without `create` permission on
 * that collection rather than rendered as buttons that would fail.
 */
export function ConsoleQuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <nav aria-label="Quick actions" className="rer-console__actions">
      {actions.map((action) => (
        <Link
          className={`rer-console__action${action.primary ? ' rer-console__action--primary' : ''}`}
          href={action.href}
          key={action.key}
        >
          {action.primary ? <span aria-hidden="true">+ </span> : null}
          {action.label}
        </Link>
      ))}
    </nav>
  );
}

export default ConsoleQuickActions;
