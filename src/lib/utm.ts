/**
 * UTM parameter tracking utilities.
 *
 * Captures marketing attribution from URL parameters and persists
 * them in sessionStorage for the duration of the visit. This allows
 * tracking the original acquisition source even as users navigate.
 */

const UTM_STORAGE_KEY = 'debateai_utm';

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  landing_page?: string;
  captured_at?: string;
}

const UTM_KEYS: (keyof UtmParams)[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
];

/**
 * Parse UTM parameters from a URL search string.
 */
export function parseUtmParams(search: string): Partial<UtmParams> {
  const params = new URLSearchParams(search);
  const utm: Partial<UtmParams> = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      utm[key] = value;
    }
  }

  return utm;
}

/**
 * Get stored UTM params from sessionStorage.
 * Returns empty object if none stored or not in browser.
 */
export function getStoredUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};

  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Store UTM params in sessionStorage.
 * Only stores if there are actual UTM params to save.
 */
export function storeUtmParams(params: UtmParams): void {
  if (typeof window === 'undefined') return;

  try {
    // Only store if we have at least one UTM param or referrer
    const hasData = Object.values(params).some((v) => v);
    if (hasData) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params));
    }
  } catch {
    // sessionStorage might be blocked; fail silently
  }
}

/**
 * Capture UTM params from current URL and document.referrer.
 * Call once on app load (in AnalyticsProvider).
 *
 * Only captures if:
 * - We haven't already captured params this session, OR
 * - New UTM params are present in the URL
 */
export function captureUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};

  const existing = getStoredUtmParams();
  const fromUrl = parseUtmParams(window.location.search);

  // If URL has UTM params, they take precedence (new campaign click)
  const hasNewUtm = Object.keys(fromUrl).length > 0;

  if (hasNewUtm) {
    const params: UtmParams = {
      ...fromUrl,
      referrer: document.referrer || undefined,
      landing_page: window.location.pathname,
      captured_at: new Date().toISOString(),
    };
    storeUtmParams(params);
    return params;
  }

  // No new UTM params — use existing or capture referrer for first visit
  if (Object.keys(existing).length > 0) {
    return existing;
  }

  // First visit without UTM — just capture referrer
  const params: UtmParams = {
    referrer: document.referrer || undefined,
    landing_page: window.location.pathname,
    captured_at: new Date().toISOString(),
  };
  storeUtmParams(params);
  return params;
}

/**
 * Get attribution context for analytics events.
 * Returns a flat object suitable for event properties.
 */
export function getAttributionContext(): Record<string, string | undefined> {
  const utm = getStoredUtmParams();
  return {
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    utm_content: utm.utm_content,
    utm_term: utm.utm_term,
    referrer: utm.referrer,
    landing_page: utm.landing_page,
  };
}
