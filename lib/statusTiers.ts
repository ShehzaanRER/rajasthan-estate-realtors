/**
 * Shared status vocabulary tiering for the admin panel.
 *
 * Extracted from `components/payload/StatusBadge.tsx` when the dashboard
 * console needed the same badges, for the same reason
 * `lib/properties/agreementCountdown.ts` exists: two places rendering the
 * same status must not be able to disagree about what that status means or
 * what colour it is.
 */

export type StatusTier = 'neutral' | 'attention' | 'positive' | 'concluded';

/**
 * Semantic tier per raw status value, shared by every collection that renders
 * a status (Properties + Projects today). These are groupings of the
 * *existing* select options, not new statuses:
 *  - neutral: not yet public (draft)
 *  - attention: in the pipeline / needs a decision (under-offer, upcoming,
 *    under-construction)
 *  - positive: live and actionable right now (available, ready-to-move)
 *  - concluded: off the market — deal or launch is done (sold, rented,
 *    completed, sold-out)
 * Anything not listed here (a future status, or a value that matches no
 * option) falls back to "neutral" rather than throwing.
 */
export const STATUS_TIERS: Record<string, StatusTier> = {
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
// under Payload's dark theme automatically, so a badge needs no light/dark
// handling of its own.
export const TIER_STYLES: Record<StatusTier, { background: string; border: string; color: string }> = {
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

export function statusTier(value: string): StatusTier {
  return STATUS_TIERS[value] ?? 'neutral';
}
