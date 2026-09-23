import type { DefaultServerCellComponentProps } from 'payload';
import { COUNTDOWN_TIER_STYLES, describeAgreementCountdown } from '../../lib/properties/agreementCountdown';

/**
 * List-view Cell for `currentAgreementEndDate`. Renders "N days left" /
 * "Expired N days ago" instead of a bare date, so a scan of the sorted
 * column reads as an urgency list rather than requiring mental date math.
 * Day-math and urgency tiering live in lib/properties/agreementCountdown.ts,
 * shared with the sidebar display (AgreementCountdownSidebar) so the two can
 * never disagree on what "urgent" means.
 */
export function AgreementCountdownCell({ cellData }: DefaultServerCellComponentProps) {
  const raw = typeof cellData === 'string' ? cellData : null;
  const countdown = describeAgreementCountdown(raw);

  if (!countdown) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>;
  }

  const style = COUNTDOWN_TIER_STYLES[countdown.tier];
  const dateLabel = new Date(raw as string).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <span
      title={dateLabel}
      style={{
        background: style.background,
        border: `1px solid ${style.border}`,
        borderRadius: 999,
        color: style.color,
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '18px',
        padding: '2px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {countdown.label}
    </span>
  );
}

export default AgreementCountdownCell;
