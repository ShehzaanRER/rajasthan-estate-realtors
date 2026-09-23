/**
 * Deterministic Agreement End Date calculation for Rent Details.
 *
 * End Date = the LAST calendar day of the agreement term (inclusive):
 * Start Date + Term (whole months) − 1 day, with the day-of-month clamped
 * during the month-addition step to the last valid day of that intermediate
 * month — the standard "add N months" convention (31 Jan + 1 month lands on
 * 28/29 Feb, never overflows into March) — before subtracting the day.
 *
 * Examples: 01 Feb 2026 + 11 months → 31 Dec 2026. 01 Feb 2028 + 1 month
 * (leap year) → 29 Feb 2028. 01 Jan 2026 + 1 month → 31 Jan 2026.
 *
 * Pure `Date` arithmetic in UTC. `Date.UTC`/`setUTCFullYear` already
 * normalize an out-of-range month index into the correct year (month 13
 * becomes January of the following year), which is the engine's own
 * calendar math, not string concatenation — the only manual step here is
 * clamping the day, which is the one thing that normalization doesn't do
 * the way a lease calculation needs.
 */

/**
 * Adds `months` calendar months to `date`, clamping the day-of-month so an
 * overshoot (e.g. 31 Jan + 1 month) lands on the last day of the target
 * month (28 or 29 Feb) instead of rolling into the month after.
 */
export function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  // Date.UTC(y, m, 0) is the last day of month `m - 1` in year `y`, and
  // normalizes an out-of-range month index (negative or >11) into the
  // correct year on its own.
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + months + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  const result = new Date(date.getTime());
  result.setUTCFullYear(year, month + months, clampedDay);
  return result;
}

export type AgreementEndDateInput = {
  startDate: Date | string | null | undefined;
  termMonths: number | null | undefined;
};

/**
 * Returns the calculated Agreement End Date — the last calendar day of the
 * term, inclusive — or `null` when either input is missing or invalid.
 * Callers must treat `null` as "cannot be determined" rather than falling
 * back to a guess.
 */
export function calculateAgreementEndDate({
  startDate,
  termMonths,
}: AgreementEndDateInput): Date | null {
  if (startDate == null || termMonths == null || termMonths === ('' as unknown)) {
    return null;
  }

  const start = startDate instanceof Date ? startDate : new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  // Whole months only — a lease term isn't fractional. Anything else
  // (zero, negative, non-numeric) means there isn't a usable term yet.
  const months = Math.trunc(Number(termMonths));
  if (!Number.isFinite(months) || months <= 0) {
    return null;
  }

  // Start + N months lands on the day the NEXT term would begin; the last
  // day of THIS term is one day before that. setUTCDate naturally rolls back
  // across a month/year boundary (e.g. 1 Mar minus 1 day → the last day of
  // February, leap years included).
  const dayAfterTerm = addMonthsClamped(start, months);
  const lastDayOfTerm = new Date(dayAfterTerm.getTime());
  lastDayOfTerm.setUTCDate(lastDayOfTerm.getUTCDate() - 1);
  return lastDayOfTerm;
}
