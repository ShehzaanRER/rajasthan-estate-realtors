/**
 * Shared client-side storage helpers for the site-wide enquiry popup.
 * Used by both EnquiryPopup.jsx (to decide whether to show/dismiss) and
 * ContactForm.jsx (so a real form submission also suppresses future popups,
 * even if the visitor reached /contact without going through the popup).
 */

const DISMISS_KEY = 'rer_enquiry_popup_dismissed_at';
const ENGAGED_KEY = 'rer_enquiry_popup_engaged_at';
const SESSION_KEY = 'rer_enquiry_popup_shown';

const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const ENGAGED_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private browsing, disabled, etc.) — fail silently.
  }
}

export function hasShownThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function markShownThisSession(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // ignore
  }
}

/** True if the popup was recently dismissed or the visitor already engaged (submitted/clicked through). */
export function isWithinCooldown(): boolean {
  const now = Date.now();
  const engagedAt = Number(safeGet(ENGAGED_KEY) || 0);
  if (engagedAt && now - engagedAt < ENGAGED_COOLDOWN_MS) {
    return true;
  }

  const dismissedAt = Number(safeGet(DISMISS_KEY) || 0);
  if (dismissedAt && now - dismissedAt < DISMISS_COOLDOWN_MS) {
    return true;
  }

  return false;
}

export function recordDismissal(): void {
  safeSet(DISMISS_KEY, String(Date.now()));
}

/** Call when the visitor has meaningfully engaged: clicked through from the popup, or submitted the contact form. */
export function recordEngagement(): void {
  safeSet(ENGAGED_KEY, String(Date.now()));
}
