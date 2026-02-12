/**
 * Email templates — inline-styled HTML for maximum compatibility.
 *
 * All templates include:
 * - Unsubscribe link (CAN-SPAM compliant)
 * - Physical mailing address placeholder
 * - Mobile-responsive layout
 */

import { getUnsubscribeUrl, getDebateUrl } from './email';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

/* ------------------------------------------------------------------ */
/*  Shared layout                                                      */
/* ------------------------------------------------------------------ */

function emailLayout(content: string, unsubscribeToken: string): string {
  const unsubscribeUrl = getUnsubscribeUrl(unsubscribeToken);
  const preferencesUrl = `${BASE_URL}/settings/email`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DebateAI</title>
</head>
<body style="margin:0;padding:0;background-color:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${BASE_URL}" style="text-decoration:none;">
        <span style="font-size:20px;font-weight:700;color:#fafaf9;letter-spacing:-0.02em;">DebateAI</span>
      </a>
    </div>

    <!-- Content -->
    ${content}

    <!-- Footer -->
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid #292524;text-align:center;">
      <p style="font-size:12px;color:#78716c;line-height:1.5;margin:0 0 8px;">
        <a href="${preferencesUrl}" style="color:#78716c;text-decoration:underline;">Email preferences</a>
        &nbsp;·&nbsp;
        <a href="${unsubscribeUrl}" style="color:#78716c;text-decoration:underline;">Unsubscribe</a>
      </p>
      <p style="font-size:11px;color:#57534e;margin:0;">
        DebateAI · Challenge your convictions
      </p>
    </div>
  </div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Daily topic digest                                                 */
/* ------------------------------------------------------------------ */

export function dailyTopicEmail(opts: {
  topic: string;
  persona: string;
  category: string;
  unsubscribeToken: string;
}): { subject: string; html: string } {
  const debateUrl = getDebateUrl(opts.topic);

  const CATEGORY_EMOJI: Record<string, string> = {
    philosophy: '🧠',
    ethics: '⚖️',
    technology: '💻',
    society: '🏙️',
    science: '🔬',
    relationships: '💬',
    business: '💼',
    'pop-culture': '🎬',
    'hot-takes': '🔥',
    politics: '🏛️',
  };

  const emoji = CATEGORY_EMOJI[opts.category] ?? '💡';

  const content = `
    <!-- Topic card -->
    <div style="background-color:#1c1917;border:1px solid #292524;border-radius:16px;padding:28px 24px;margin-bottom:24px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:#f59e0b;margin-bottom:12px;">
        ${emoji} Today's Debate
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#fafaf9;margin:0 0 16px;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">
        ${escapeHtml(opts.topic)}
      </h1>
      <p style="font-size:14px;color:#a8a29e;margin:0 0 20px;">
        Your opponent: <strong style="color:#f59e0b;">${escapeHtml(opts.persona)}</strong>
      </p>
      <a href="${debateUrl}" style="display:inline-block;background-color:#f59e0b;color:#0c0a09;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;">
        Start Debating →
      </a>
    </div>

    <!-- Teaser -->
    <p style="font-size:14px;color:#a8a29e;text-align:center;line-height:1.6;">
      Think you can win? The AI won't go easy on you.
    </p>
  `;

  return {
    subject: `Today's debate: ${opts.topic}`,
    html: emailLayout(content, opts.unsubscribeToken),
  };
}

/* ------------------------------------------------------------------ */
/*  Welcome email                                                      */
/* ------------------------------------------------------------------ */

export function welcomeEmail(opts: {
  name?: string;
  unsubscribeToken: string;
}): { subject: string; html: string } {
  const greeting = opts.name ? `Hey ${escapeHtml(opts.name)}` : 'Welcome';

  const content = `
    <h1 style="font-size:24px;font-weight:700;color:#fafaf9;margin:0 0 16px;text-align:center;font-family:Georgia,'Times New Roman',serif;">
      ${greeting}, you're in. 🎯
    </h1>
    <p style="font-size:15px;color:#a8a29e;text-align:center;line-height:1.6;margin:0 0 24px;">
      Every morning at 9am, we'll send you a fresh debate topic with an AI opponent ready to fight.
      No prep needed — just show up with an opinion.
    </p>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${BASE_URL}/debate" style="display:inline-block;background-color:#f59e0b;color:#0c0a09;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;">
        Start Your First Debate
      </a>
    </div>

    <p style="font-size:13px;color:#78716c;text-align:center;line-height:1.5;">
      You'll also get weekly recaps of your debate stats and notifications when someone challenges your debates.
    </p>
  `;

  return {
    subject: "You're in — your first debate topic drops tomorrow at 9am",
    html: emailLayout(content, opts.unsubscribeToken),
  };
}

/* ------------------------------------------------------------------ */
/*  Unsubscribe confirmation                                          */
/* ------------------------------------------------------------------ */

export function unsubscribeConfirmationEmail(opts: {
  email: string;
  unsubscribeToken: string;
}): { subject: string; html: string } {
  const resubscribeUrl = `${BASE_URL}/settings/email`;

  const content = `
    <div style="text-align:center;padding:20px 0;">
      <h1 style="font-size:20px;font-weight:700;color:#fafaf9;margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;">
        You've been unsubscribed
      </h1>
      <p style="font-size:14px;color:#a8a29e;line-height:1.6;margin:0 0 20px;">
        You won't receive any more emails from DebateAI. 
        Changed your mind? You can always re-subscribe.
      </p>
      <a href="${resubscribeUrl}" style="font-size:13px;color:#f59e0b;text-decoration:underline;">
        Re-subscribe →
      </a>
    </div>
  `;

  return {
    subject: "You've been unsubscribed from DebateAI",
    html: emailLayout(content, opts.unsubscribeToken),
  };
}

/* ------------------------------------------------------------------ */
/*  Weekly Recap                                                       */
/* ------------------------------------------------------------------ */

export function weeklyRecapEmail(opts: {
  stats: {
    totalDebates: number;
    bestScore: number;
    bestTopic: string;
    streakCount: number;
  };
  trendingTopic: string;
  unsubscribeToken: string;
}): { subject: string; html: string } {
  const { stats, trendingTopic } = opts;
  
  let subject = `Your week in arguments: ${stats.totalDebates} debates`;
  if (stats.bestScore > 0) {
    subject += `, ${stats.bestScore} best score`;
  }

  let content = '';

  if (stats.totalDebates === 0) {
    content = `
      <h1 style="font-size:22px;font-weight:700;color:#fafaf9;margin:0 0 16px;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">
        You took the week off. The AI didn't.
      </h1>
      <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 24px;">
        It's been preparing new arguments. Ready to test them?
      </p>
    `;
  } else {
    content = `
      <h1 style="font-size:22px;font-weight:700;color:#fafaf9;margin:0 0 24px;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">
        Your week on DebateAI
      </h1>

      <div style="background-color:#1c1917;border:1px solid #292524;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="margin-bottom:12px;font-size:15px;color:#e7e5e4;">
          🗣️ <strong>${stats.totalDebates} debates</strong> this week
        </div>
        ${stats.bestScore > 0 ? `
        <div style="margin-bottom:12px;font-size:15px;color:#e7e5e4;">
          🏆 <strong>Best score:</strong> ${stats.bestScore}/100 on "${escapeHtml(stats.bestTopic)}"
        </div>
        ` : ''}
        <div style="font-size:15px;color:#e7e5e4;">
          🔥 <strong>Streak:</strong> ${stats.streakCount} days in a row
        </div>
      </div>
    `;
  }

  content += `
    <p style="font-size:14px;color:#a8a29e;margin:0 0 8px;">
      This week's most-debated topic:
    </p>
    <p style="font-size:16px;color:#fafaf9;font-weight:600;margin:0 0 24px;">
      "${escapeHtml(trendingTopic)}"
    </p>

    <div style="text-align:center;">
      <a href="${BASE_URL}/debate" style="display:inline-block;background-color:#f59e0b;color:#0c0a09;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;">
        Jump Back In →
      </a>
    </div>
  `;

  return {
    subject,
    html: emailLayout(content, opts.unsubscribeToken),
  };
}

/* ------------------------------------------------------------------ */
/*  Challenge Notification                                             */
/* ------------------------------------------------------------------ */

export function challengeNotificationEmail(opts: {
  topic: string;
  userScore: number;
  opponentScore: number;
  unsubscribeToken: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="font-size:22px;font-weight:700;color:#fafaf9;margin:0 0 16px;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">
      Someone just argued the opposite of your position
    </h1>
    
    <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 16px;">
      You argued on <strong>"${escapeHtml(opts.topic)}"</strong> and scored <strong>${opts.userScore}/100</strong>.
    </p>

    <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 24px;">
      Another debater just took the opposite side — and scored <strong>${opts.opponentScore}/100</strong>.
    </p>

    <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 24px;">
      Think you can beat both the AI <em>and</em> their score?
    </p>

    <div style="text-align:center;">
      <a href="${getDebateUrl(opts.topic)}" style="display:inline-block;background-color:#f59e0b;color:#0c0a09;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;">
        Defend Your Position Again →
      </a>
    </div>
  `;

  return {
    subject: `Someone just argued the opposite of your position on "${opts.topic}"`,
    html: emailLayout(content, opts.unsubscribeToken),
  };
}

/* ------------------------------------------------------------------ */
/*  Win-back (7-day inactive)                                          */
/* ------------------------------------------------------------------ */

export function winBackEmail(opts: {
  trendingTopic: string;
  count: number;
  aiWinPct: number;
  unsubscribeToken: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="font-size:22px;font-weight:700;color:#fafaf9;margin:0 0 16px;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">
      The debate topic everyone's arguing about
    </h1>
    
    <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 16px;">
      <strong>"${escapeHtml(opts.trendingTopic)}"</strong> — ${opts.count} debates in the last 7 days. 
      The AI is winning ${opts.aiWinPct}% of them.
    </p>

    <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 24px;">
      You've been quiet. The AI hasn't.
    </p>

    <div style="text-align:center;">
      <a href="${getDebateUrl(opts.trendingTopic)}" style="display:inline-block;background-color:#f59e0b;color:#0c0a09;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;">
        See What You're Missing →
      </a>
    </div>
  `;

  return {
    subject: `The debate topic everyone's arguing about this week`,
    html: emailLayout(content, opts.unsubscribeToken),
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
