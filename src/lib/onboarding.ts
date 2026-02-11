/**
 * Onboarding state management.
 *
 * Tracks whether a user is new (never started a debate) and whether
 * they've completed their first debate. All state lives in localStorage
 * to avoid extra API calls — the onboarding flow is a lightweight
 * client-only experience.
 */

const ONBOARDED_KEY = 'debateai_onboarded';
const FIRST_COMPLETION_KEY = 'debateai_first_completion';

// ── Queries ──────────────────────────────────────────────────────

/** True if the user has never started a debate on this device. */
export function isNewUser(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDED_KEY) !== 'true';
}

/** True if the user just completed their very first debate (score generated). */
export function isFirstCompletion(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(FIRST_COMPLETION_KEY) !== 'true';
}

// ── Mutations ────────────────────────────────────────────────────

/** Mark user as onboarded — they've started (or dismissed) the flow. */
export function markOnboarded(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDED_KEY, 'true');
}

/** Mark that the user has seen the first-completion celebration. */
export function markFirstCompletion(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FIRST_COMPLETION_KEY, 'true');
}
