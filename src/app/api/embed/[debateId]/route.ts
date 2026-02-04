import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { getOpponentById } from '@/lib/opponents';
import { createRateLimiter, getClientIp } from '@/lib/rate-limit';

// 30 requests per minute per IP (embeds are heavier — full HTML responses)
const limiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });

/**
 * GET /api/embed/[debateId]
 *
 * Returns a lightweight, self-contained HTML page for embedding debates.
 * Designed for iframes — no external JS dependencies, minimal CSS.
 *
 * Query params:
 *   ?maxMessages=10  — limit displayed messages (default 10)
 *   ?theme=dark|light — color scheme (default dark)
 *
 * Usage:
 *   <iframe src="https://debateai.org/api/embed/DEBATE_ID" width="600" height="400"></iframe>
 *
 * Rate limited: 30 req/min per IP.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ debateId: string }> }
) {
  const ip = getClientIp(request);
  const rateLimit = limiter.check(ip);
  if (!rateLimit.allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { ...rateLimit.headers, 'Content-Type': 'text/plain' },
    });
  }
  try {
    const { debateId } = await params;
    const { searchParams } = new URL(request.url);
    const maxMessages = Math.min(
      parseInt(searchParams.get('maxMessages') || '10', 10),
      50
    );
    const theme = searchParams.get('theme') === 'light' ? 'light' : 'dark';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

    if (!debateId) {
      return new NextResponse('Debate ID required', { status: 400 });
    }

    const result = await d1.getDebate(debateId);

    if (!result.success || !result.debate) {
      return new NextResponse(
        embedErrorHtml('Debate not found', theme),
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const debate = result.debate;
    const opponent = getOpponentById(debate.character as any);
    const opponentName =
      (debate.opponentStyle as string) || opponent?.name || 'AI Opponent';
    const topic = (debate.topic as string) || 'Debate';
    const messages = Array.isArray(debate.messages)
      ? (debate.messages as Array<{ role: string; content: string }>)
      : [];

    const displayMessages = messages
      .filter((m) => m.role && m.content)
      .slice(0, maxMessages);

    const debateUrl = `${baseUrl}/debate/${debateId}`;

    const html = generateEmbedHtml({
      topic,
      opponentName,
      messages: displayMessages,
      debateUrl,
      theme,
      totalMessages: messages.length,
      shownMessages: displayMessages.length,
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (error) {
    console.error('Embed API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embed' },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateEmbedHtml(opts: {
  topic: string;
  opponentName: string;
  messages: Array<{ role: string; content: string }>;
  debateUrl: string;
  theme: string;
  totalMessages: number;
  shownMessages: number;
}): string {
  const isDark = opts.theme === 'dark';
  const bg = isDark ? '#0a0a0b' : '#ffffff';
  const text = isDark ? '#e4e4e7' : '#18181b';
  const textSecondary = isDark ? '#a1a1aa' : '#71717a';
  const border = isDark ? '#27272a' : '#e4e4e7';
  const accent = isDark ? '#c9664a' : '#c9664a';
  const userBg = isDark ? 'transparent' : 'transparent';
  const aiBg = isDark ? 'rgba(39,39,42,0.5)' : 'rgba(244,244,245,0.8)';

  const messagesHtml = opts.messages
    .map((msg) => {
      const isUser = msg.role === 'user';
      const name = isUser ? 'You' : escapeHtml(opts.opponentName);
      const msgBg = isUser ? userBg : aiBg;
      return `
        <div style="padding:12px 16px;background:${msgBg};border-bottom:1px solid ${border}">
          <div style="font-size:12px;font-weight:600;color:${isUser ? accent : textSecondary};margin-bottom:4px">${name}</div>
          <div style="font-size:14px;line-height:1.6;color:${text};white-space:pre-wrap">${escapeHtml(msg.content)}</div>
        </div>`;
    })
    .join('');

  const moreText =
    opts.totalMessages > opts.shownMessages
      ? `<div style="padding:12px 16px;text-align:center;font-size:12px;color:${textSecondary}">
          Showing ${opts.shownMessages} of ${opts.totalMessages} messages
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(opts.topic)} — DebateAI</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:${bg};color:${text}}
    a{color:${accent};text-decoration:none}
    a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div style="border:1px solid ${border};border-radius:12px;overflow:hidden;max-width:100%">
    <!-- Header -->
    <div style="padding:16px;border-bottom:1px solid ${border}">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:${accent};margin-bottom:4px">Debate</div>
      <div style="font-size:16px;font-weight:600;color:${text}">${escapeHtml(opts.topic)}</div>
      <div style="font-size:12px;color:${textSecondary};margin-top:2px">vs ${escapeHtml(opts.opponentName)}</div>
    </div>

    <!-- Messages -->
    <div style="max-height:400px;overflow-y:auto">
      ${messagesHtml}
      ${moreText}
    </div>

    <!-- Footer -->
    <div style="padding:12px 16px;border-top:1px solid ${border};display:flex;align-items:center;justify-content:space-between">
      <a href="${escapeHtml(opts.debateUrl)}" target="_blank" rel="noopener" style="font-size:12px;font-weight:500">
        View full debate →
      </a>
      <span style="font-size:11px;color:${textSecondary}">DebateAI</span>
    </div>
  </div>
</body>
</html>`;
}

function embedErrorHtml(message: string, theme: string): string {
  const isDark = theme === 'dark';
  const bg = isDark ? '#0a0a0b' : '#ffffff';
  const text = isDark ? '#a1a1aa' : '#71717a';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:${bg};color:${text}}</style></head>
<body><p>${escapeHtml(message)}</p></body>
</html>`;
}
