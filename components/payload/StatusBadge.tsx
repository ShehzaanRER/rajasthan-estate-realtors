import type { DefaultServerCellComponentProps } from 'payload';

type StatusTier = 'neutral' | 'attention' | 'positive' | 'concluded';

/**
 * Semantic tier per raw status value, shared across every collection that
 * registers this Cell (Properties + Projects today). These are groupings of
 * the *existing* select options, not new statuses:
 *  - neutral: not yet public (draft)
 *  - attention: in the pipeline / needs a decision (under-offer, upcoming,
 *    under-construction)
 *  - positive: live and actionable right now (available, ready-to-move)
 *  - concluded: off the market — deal or launch is done (sold, rented,
 *    completed, sold-out)
 * Anything not listed here (a future status, or a value that doesn't match
 * any option) falls back to "neutral" rather than throwing.
 */
const STATUS_TIERS: Record<string, StatusTier> = {
  draft: 'neutral',
  available: 'positive',
  'under-offer': 'attention',
  sold: 'concluded',
  rented: 'concluded',
  upcoming: 'attention',
  'under-construction': 'attention',
  'ready-to-move': 'positive',
  completed: 'concluded',
  'sold-out': 'concluded',
};

// Payload's own semantic theming tokens (see @payloadcms/ui's Banner
// component for the same background/text pairing) — these are redefined
// under Payload's dark theme automatically, so the badge needs no
// light/dark handling of its own.
const TIER_STYLES: Record<StatusTier, { background: string; border: string; color: string }> = {
  neutral: {
    background: 'var(--theme-elevation-100)',
    border: 'var(--theme-elevation-150)',
    color: 'var(--theme-elevation-600)',
  },
  attention: {
    background: 'var(--theme-warning-100)',
    border: 'var(--theme-warning-150)',
    color: 'var(--theme-warning-800)',
  },
  positive: {
    background: 'var(--theme-success-100)',
    border: 'var(--theme-success-200)',
    color: 'var(--theme-success-600)',
  },
  concluded: {
    background: 'var(--theme-elevation-800)',
    border: 'var(--theme-elevation-800)',
    color: 'var(--theme-elevation-0)',
  },
};

type SelectOption = string | { label?: unknown; value?: unknown };

/**
 * Reads the human-readable label straight from the field's own `options`
 * (the same list the native Select edit field uses) rather than keeping a
 * second copy of the label text here. Falls back to the raw value if the
 * field has no matching option — e.g. a status value that predates a label
 * change, or one this Cell doesn't otherwise recognise.
 */
function findOptionLabel(rawOptions: unknown, value: string): string {
  if (Array.isArray(rawOptions)) {
    for (const option of rawOptions as SelectOption[]) {
      if (typeof option === 'string') {
        if (option === value) {
          return option;
        }
        continue;
      }

      if (option?.value === value && typeof option.label === 'string') {
        return option.label;
      }
    }
  }

  return value;
}

export function StatusBadge({ cellData, field }: DefaultServerCellComponentProps) {
  const value = typeof cellData === 'string' ? cellData : cellData == null ? '' : String(cellData);

  if (!value) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>;
  }

  const tier = STATUS_TIERS[value] ?? 'neutral';
  const style = TIER_STYLES[tier];
  const label = findOptionLabel((field as { options?: unknown })?.options, value);

  return (
    <span
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
      {label}
    </span>
  );
}

export default StatusBadge;
