/**
 * Lightweight, provider-agnostic analytics instrumentation.
 *
 * Tracks key user actions as typed events. No third-party SDK — just
 * a dispatch layer that can be wired to any provider (GA4, Mixpanel,
 * PostHog, custom API) by registering a handler.
 *
 * Usage:
 *   import { track } from '@/lib/analytics';
 *   track('debate_created', { topic: 'AI regulation', opponent: 'Socratic' });
 *
 * To connect a provider:
 *   import { registerProvider } from '@/lib/analytics';
 *   registerProvider((event, props) => {
 *     window.gtag?.('event', event, props);
 *   });
 *
 * Attribution:
 *   All events are automatically enriched with UTM parameters and referrer
 *   data captured on page load. See src/lib/utm.ts for details.
 *   Fields added: utm_source, utm_medium, utm_campaign, utm_content,
 *   utm_term, referrer, landing_page.
 */

// ── Event definitions ────────────────────────────────────────────

export interface AnalyticsEvents {
  // Debate lifecycle
  debate_created: {
    debateId: string;
    topic: string;
    opponent: string;
    source: 'quick_start' | 'custom_setup' | 'daily_debate';
  };
  debate_message_sent: {
    debateId: string;
    messageIndex: number;
    aiAssisted: boolean;
  };
  debate_completed: {
    debateId: string;
    topic: string;
    opponent: string;
    userScore: number;
    aiScore: number;
    roastLevel: string;
    messageCount: number;
  };

  debate_scored: {
    debateId: string;
    winner: 'user' | 'ai' | 'draw';
    userScore: number;
    aiScore: number;
  };

  debate_ai_takeover: {
    debateId: string;
    messageIndex: number;
  };

  debate_rematch: {
    debateId: string;
    originalDebateId: string;
    topic: string;
    opponent: string;
    source: 'rematch' | string; // rematch = same topic, topic-* = suggested topic
  };

  // Sharing
  debate_shared: {
    debateId: string;
    method: 'copy_link' | 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'native_share';
    source?: 'button' | 'modal' | 'post_debate';
  };
  share_button_clicked: {
    debateId: string;
    location: 'topic_header' | 'score_screen' | 'embed';
  };
  share_image_generated: {
    debateId: string;
  };
  share_image_downloaded: {
    debateId: string;
  };
  share_image_shared: {
    debateId: string;
    method: 'twitter' | 'download' | 'copy_link';
  };
  share_image_copied: {
    debateId: string;
  };

  // Engagement
  cta_clicked: {
    ctaId: string;
    location: string;
    destination: string;
  };
  upgrade_modal_shown: {
    trigger: 'rate_limit_debate' | 'rate_limit_message' | 'button';
  };
  upgrade_clicked: {
    source: string;
  };

  // Navigation & Attribution
  session_started: {
    landing_page: string;
    // UTM params auto-attached by provider
  };
  page_viewed: {
    path: string;
    title: string;
    referrer?: string;
  };

  // Onboarding funnel
  onboarding_landed: Record<string, never>;
  onboarding_step_viewed: {
    step: number;
    total: number;
  };
  onboarding_started: {
    topic: string;
    source: 'onboarding';
  };
  onboarding_completed: {
    winner: 'user' | 'ai' | 'draw';
    userScore: number;
    aiScore: number;
  };

  // Explore
  explore_debate_viewed: {
    debateId: string;
    topic: string;
    source: 'explore';
  };

  // Blog
  blog_post_viewed: {
    slug: string;
    title: string;
    tags: string[];
    readingTime: number;
  };
  blog_cta_clicked: {
    slug: string;
    ctaType: 'start_debate' | 'related_post';
  };
}

// ── Provider system ──────────────────────────────────────────────

type EventName = keyof AnalyticsEvents;
type EventProps<T extends EventName> = AnalyticsEvents[T];
type ProviderFn = (event: string, properties: Record<string, unknown>) => void;

const providers: ProviderFn[] = [];

/**
 * Register an analytics provider. Called once at app init.
 * Multiple providers can be registered (e.g., GA4 + custom API).
 */
export function registerProvider(fn: ProviderFn): void {
  providers.push(fn);
}

// ── Core track function ──────────────────────────────────────────

/**
 * Track an analytics event. Type-safe — only accepts defined events
 * with their correct property shapes.
 */
export function track<T extends EventName>(
  event: T,
  properties: EventProps<T>
): void {
  // Dev logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[analytics] ${event}`, properties);
  }

  // Dispatch to registered providers
  const props = properties as Record<string, unknown>;
  for (const provider of providers) {
    try {
      provider(event, props);
    } catch (err) {
      console.error(`[analytics] Provider error on ${event}:`, err);
    }
  }

  // Dispatch as custom DOM event (for any listener-based integrations)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('analytics', {
        detail: { event, properties: props },
      })
    );
  }
}

// ── Convenience helpers ──────────────────────────────────────────

/** Track a page view. Call from layout or route change handler. */
export function trackPageView(path: string, title: string): void {
  track('page_viewed', {
    path,
    title,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
  });
}
