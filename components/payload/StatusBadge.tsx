import type { DefaultServerCellComponentProps } from 'payload';
import { statusTier, TIER_STYLES } from '../../lib/statusTiers';

/**
 * Status tiers, their labels-to-colour mapping and the badge styling live in
 * lib/statusTiers.ts, shared with the dashboard console so the same status
 * can never render two different ways.
 */
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

  const style = TIER_STYLES[statusTier(value)];
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
