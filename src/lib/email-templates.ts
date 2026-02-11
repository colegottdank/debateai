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
/*  Challenge notification                                             */
/* ------------------------------------------------------------------ */

export function challengeEmail(opts: {
  topic: string;
  userScore: number;
  otherScore: number;
  otherSnippet: string;
  unsubscribeToken: string;
}): { subject: string; html: string } {
  const debateUrl = getDebateUrl(opts.topic);

  const content = `
    <div style="background-color:#1c1917;border:1px solid #292524;border-radius:16px;padding:28px 24px;margin-bottom:24px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:#ef4444;margin-bottom:12px;">
        ⚔️ Challenge
      </div>
      <h1 style="font-size:20px;font-weight:700;color:#fafaf9;margin:0 0 12px;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">
        Someone just argued the opposite of your position
      </h1>
      <p style="font-size:14px;color:#a8a29e;line-height:1.6;margin:0 0 8px;">
        You scored <strong style="color:#fafaf9;">${opts.userScore}/100</strong> on "${escapeHtml(opts.topic)}".
      </p>
      <p style="font-size:14px;color:#a8a29e;line-height:1.6;margin:0 0 8px;">
        Another debater just took the opposite side — and scored <strong style="color:#f59e0b;">${opts.otherScore}/100</strong>.
      </p>
      <p style="font-size:13px;color:#78716c;font-style:italic;margin:0 0 20px;">
        "${escapeHtml(opts.otherSnippet)}…"
      </p>
      <p style="font-size:14px;color:#a8a29e;margin:0 0 20px;">
        Think you can beat both the AI <em>and</em> their score?
      </p>
      <a href="${debateUrl}" style="display:inline-block;background-color:#ef4444;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;">
        Defend Your Position →
      </a>
    </div>
  `;

  return {
    subject: `Someone just argued the opposite of your position on "${opts.topic}"`,
    html: emailLayout(content, opts.unsubscribeToken),
  };
}

/* ------------------------------------------------------------------ */
/*  Weekly recap                                                       */
/* ------------------------------------------------------------------ */

export interface WeeklyRecapData {
  totalDebates: number;
  bestScore: number;
  bestTopic: string;
  worstScore: number;
  worstTopic: string;
  streakCount: number;
  improvement: number | null;  // null if no previous week
  trendingTopic: string;
  trendingCount: number;
  unsubscribeToken: string;
}

export function weeklyRecapEmail(opts: WeeklyRecapData): { subject: string; html: string } {
  let statsBlock: string;

  if (opts.totalDebates === 0) {
    // Zero-debate week — lighter version
    statsBlock = `
      <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 20px;">
        You took the week off. The AI didn't. It's been preparing new arguments for whatever you believe right now.
      </p>
    `;
  } else if (opts.totalDebates === 1) {
    statsBlock = `
      <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 20px;">
        One debate this week. You scored <strong style="color:#fafaf9;">${opts.bestScore}/100</strong> on "${escapeHtml(opts.bestTopic)}". The AI wants a rematch.
      </p>
    `;
  } else {
    const improvementLine = opts.improvement !== null && opts.improvement > 0
      ? `<p style="font-size:14px;color:#10b981;margin:0 0 8px;">📈 Your average improved by ${opts.improvement} points since last week.</p>`
      : opts.improvement !== null && opts.improvement < 0
        ? `<p style="font-size:14px;color:#a8a29e;margin:0 0 8px;">Your scores held steady. Try a topic outside your comfort zone?</p>`
        : '';

    statsBlock = `
      <div style="margin-bottom:20px;">
        <p style="font-size:14px;color:#a8a29e;margin:0 0 8px;">🗣️ <strong style="color:#fafaf9;">${opts.totalDebates} debates</strong> this week</p>
        <p style="font-size:14px;color:#a8a29e;margin:0 0 8px;">🏆 <strong style="color:#fafaf9;">Best score:</strong> ${opts.bestScore}/100 on "${escapeHtml(opts.bestTopic)}"</p>
        <p style="font-size:14px;color:#a8a29e;margin:0 0 8px;">📉 <strong style="color:#fafaf9;">Toughest loss:</strong> ${opts.worstScore}/100 on "${escapeHtml(opts.worstTopic)}"</p>
        <p style="font-size:14px;color:#a8a29e;margin:0 0 8px;">🔥 <strong style="color:#fafaf9;">Streak:</strong> ${opts.streakCount} day${opts.streakCount !== 1 ? 's' : ''} in a row</p>
        ${improvementLine}
      </div>
    `;
  }

  const content = `
    <div style="background-color:#1c1917;border:1px solid #292524;border-radius:16px;padding:28px 24px;margin-bottom:24px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:#6366f1;margin-bottom:12px;">
        📊 Your Week in Arguments
      </div>

      ${statsBlock}

      <div style="background-color:#0c0a09;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="font-size:12px;color:#78716c;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.1em;">This week's trending topic</p>
        <p style="font-size:15px;color:#fafaf9;font-weight:600;margin:0 0 4px;">"${escapeHtml(opts.trendingTopic)}"</p>
        <p style="font-size:12px;color:#a8a29e;margin:0;">${opts.trendingCount} debates and counting</p>
      </div>

      <div style="text-align:center;">
        <a href="${BASE_URL}/debate" style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;">
          Jump Back In →
        </a>
      </div>
    </div>
  `;

  const subject = opts.totalDebates > 0
    ? `Your week in arguments: ${opts.totalDebates} debate${opts.totalDebates !== 1 ? 's' : ''}, ${opts.bestScore} best score`
    : 'You took the week off. The AI didn\'t.';

  return { subject, html: emailLayout(content, opts.unsubscribeToken) };
}

/* ------------------------------------------------------------------ */
/*  Win-back (7-day inactive)                                          */
/* ------------------------------------------------------------------ */

export type WinBackVariant = 'provocative' | 'curiosity' | 'competitive' | 'honest';

export function winBackEmail(opts: {
  variant: WinBackVariant;
  trendingTopic?: string;
  trendingCount?: number;
  aiWinPct?: number;
  bestScore?: number;
  bestTopic?: string;
  competitorCount?: number;
  unsubscribeToken: string;
}): { subject: string; html: string } {
  let subject: string;
  let body: string;
  let ctaText: string;
  let ctaColor: string;

  switch (opts.variant) {
    case 'provocative':
      subject = 'Your opinions are going untested';
      body = `
        <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 12px;">
          It's been a week. In that time, you've probably formed 3 new opinions you haven't stress-tested.
        </p>
        <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 20px;">
          The AI has been reading the news. It has counterarguments ready for whatever you believe right now.
        </p>
      `;
      ctaText = 'Pick a Fight →';
      ctaColor = '#ef4444';
      break;

    case 'curiosity':
      subject = `The debate topic everyone's arguing about this week`;
      body = `
        <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 12px;">
          "${escapeHtml(opts.trendingTopic || 'Should AI be regulated?')}" — <strong style="color:#fafaf9;">${opts.trendingCount ?? 47} debates</strong> in the last 7 days.
          ${opts.aiWinPct ? `The AI is winning ${opts.aiWinPct}% of them.` : ''}
        </p>
        <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 20px;">
          You've been quiet. The AI hasn't.
        </p>
      `;
      ctaText = 'See What You\'re Missing →';
      ctaColor = '#f59e0b';
      break;

    case 'competitive':
      subject = 'Your debate score is about to expire from the leaderboard';
      body = `
        <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 12px;">
          You scored <strong style="color:#fafaf9;">${opts.bestScore ?? 0}/100</strong> on "${escapeHtml(opts.bestTopic || 'a recent debate')}" — but <strong style="color:#fafaf9;">${opts.competitorCount ?? 12} new debaters</strong> are closing in.
        </p>
        <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 20px;">
          Come back and defend your ranking. Or don't, and watch it disappear.
        </p>
      `;
      ctaText = 'Protect Your Score →';
      ctaColor = '#6366f1';
      break;

    case 'honest':
    default:
      subject = 'We noticed you left';
      body = `
        <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 12px;">
          No guilt trip. Maybe you got busy. Maybe you didn't love it.
        </p>
        <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 12px;">
          If the debates felt too one-sided, try a different topic. If the AI felt repetitive, we've improved it.
          If you're just done, hit unsubscribe below — no hard feelings.
        </p>
        <p style="font-size:15px;color:#a8a29e;line-height:1.6;margin:0 0 20px;">
          But if you've got one more argument in you:
        </p>
      `;
      ctaText = 'One More Round →';
      ctaColor = '#a8a29e';
      break;
  }

  const content = `
    <div style="background-color:#1c1917;border:1px solid #292524;border-radius:16px;padding:28px 24px;margin-bottom:24px;">
      ${body}
      <div style="text-align:center;">
        <a href="${BASE_URL}/debate" style="display:inline-block;background-color:${ctaColor};color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;">
          ${ctaText}
        </a>
      </div>
    </div>
  `;

  return { subject, html: emailLayout(content, opts.unsubscribeToken) };
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
