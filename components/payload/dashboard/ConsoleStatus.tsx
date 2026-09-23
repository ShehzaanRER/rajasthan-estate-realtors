import { statusTier, TIER_STYLES } from '../../../lib/statusTiers';

/**
 * The same badge the Properties/Projects list tables render, reusing the
 * shared tier mapping and styles from lib/statusTiers.ts. The label is
 * resolved upstream from the collection's own field options, so this
 * component never holds a copy of the status vocabulary.
 */
export function ConsoleStatus({ label, value }: { label: string; value: string }) {
  if (!value) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>;
  }

  const style = TIER_STYLES[statusTier(value)];

  return (
    <span
      className="rer-console__status"
      style={{
        background: style.background,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      {label}
    </span>
  );
}

export default ConsoleStatus;
