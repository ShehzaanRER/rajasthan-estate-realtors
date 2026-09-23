/**
 * Shared "days remaining" presentation logic for `currentAgreementEndDate`
 * (collections/Properties.ts), used by both the list-view Cell
 * (AgreementCountdownCell) and the edit-page sidebar display
 * (AgreementCountdownSidebar) — one place for the day-math and urgency
 * threshold, so the two can never drift apart on what "urgent" means.
 */

export type CountdownTier = 'expired' | 'urgent' | 'comfortable';

/**
 * Badge styling per tier, using Payload's own semantic theming tokens (which
 * are re-declared under its dark theme, so a badge needs no light/dark
 * handling). Shared by the list-view Cell and the dashboard console's
 * renewals panel so an "expired" agreement looks the same in both.
 *
 * The edit-page sidebar deliberately does not use this — it renders coloured
 * text rather than a badge — but it takes its tier from the same
 * `describeAgreementCountdown()` below.
 */
export const COUNTDOWN_TIER_STYLES: Record<
  CountdownTier,
  { background: string; border: string; color: string }
> = {
  expired: {
    background: 'var(--theme-error-100)',
    border: 'var(--theme-error-150)',
    color: 'var(--theme-error-600)',
  },
  urgent: {
    background: 'var(--theme-warning-100)',
    border: 'var(--theme-warning-150)',
    color: 'var(--theme-warning-800)',
  },
  comfortable: {
    background: 'var(--theme-elevation-100)',
    border: 'var(--theme-elevation-150)',
    color: 'var(--theme-elevation-600)',
  },
};

export type AgreementCountdown = {
  daysRemaining: number;
  tier: CountdownTier;
  label: string;
};

const DAY_MS = 86_400_000;

/** Midnight UTC for `date`, matching how currentAgreementEndDate is always stored (see agreementDates.ts). */
function utcMidnight(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * `tier` mirrors the "which agreements expire in the next 60 days?"
 * question this field exists to answer: expired or due within 60 days is
 * urgent (red once overdue, amber while there's still time to call);
 * anything further out is comfortable/neutral.
 */
export function describeAgreementCountdown(isoDate: string | null | undefined): AgreementCountdown | null {
  if (!isoDate) {
    return null;
  }

  const endDate = new Date(isoDate);
  if (Number.isNaN(endDate.getTime())) {
    return null;
  }

  const daysRemaining = Math.round((utcMidnight(endDate) - utcMidnight(new Date())) / DAY_MS);
  const tier: CountdownTier = daysRemaining < 0 ? 'expired' : daysRemaining <= 60 ? 'urgent' : 'comfortable';
  const label = daysRemaining < 0 ? `Expired ${Math.abs(daysRemaining)}d ago` : `${daysRemaining}d left`;

  return { daysRemaining, tier, label };
}
