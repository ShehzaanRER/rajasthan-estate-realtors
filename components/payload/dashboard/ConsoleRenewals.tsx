import Link from 'next/link';
import type { RenewalRow } from '../../../lib/admin-console';
import { COUNTDOWN_TIER_STYLES } from '../../../lib/properties/agreementCountdown';
import { ConsolePanel } from './ConsolePanel';

function formatEndDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    // currentAgreementEndDate is always stored at midnight UTC — see
    // lib/properties/agreementDates.ts.
    timeZone: 'UTC',
  });
}

/**
 * Rented inventory ordered by how soon its agreement ends, soonest first, so
 * an expired or imminent tenancy is always the top row.
 *
 * There is no renewal "window" constant here on purpose: the urgency tiering
 * comes from `describeAgreementCountdown()`, the same function the property
 * list Cell and the edit-page sidebar already use, so expired / urgent /
 * comfortable mean one thing across the whole admin.
 */
export function ConsoleRenewals({
  href,
  rows,
  total,
}: {
  href: string;
  rows: RenewalRow[];
  total: number;
}) {
  return (
    <ConsolePanel
      action={total > rows.length ? { href, label: 'All tenancies' } : undefined}
      meta={total > rows.length ? `${rows.length} of ${total}` : undefined}
      title="Agreement renewals"
    >
      {rows.length === 0 ? (
        <p className="rer-console__empty">
          No rented property has a calculable agreement end date yet. Add a Tenancy History entry with a
          start date and term to track renewals here.
        </p>
      ) : (
        <ul className="rer-console__rows">
          {rows.map((row) => (
            <li key={row.id}>
              <Link className="rer-console__row" href={row.href}>
                <span className="rer-console__row-id">{row.rerId}</span>
                <span className="rer-console__row-body">
                  <span className="rer-console__row-title">{row.title}</span>
                  <span className="rer-console__row-sub">
                    {row.licensee ?? 'Licensee not recorded'} · ends {formatEndDate(row.endDate)}
                  </span>
                </span>
                <span
                  className="rer-console__status"
                  style={{
                    background: COUNTDOWN_TIER_STYLES[row.tier].background,
                    border: `1px solid ${COUNTDOWN_TIER_STYLES[row.tier].border}`,
                    color: COUNTDOWN_TIER_STYLES[row.tier].color,
                  }}
                >
                  {row.countdownLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ConsolePanel>
  );
}

export default ConsoleRenewals;
