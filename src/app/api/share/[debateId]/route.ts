import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { getOpponentById } from '@/lib/opponents';
import { createRateLimiter, getClientIp } from '@/lib/rate-limit';

// 60 requests per minute per IP
const limiter = createRateLimiter({ maxRequests: 60, windowMs: 60_000 });

/**
 * GET /api/share/[debateId]
 *
 * Returns share-ready metadata for a debate:
 * - title, description, URL, OG image URL
 * - Formatted share text for copy-paste
 * - Debate summary (topic, opponent, message count, score if available)
 *
 * Public endpoint — no auth required (debates are shareable).
 * Rate limited: 60 req/min per IP.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ debateId: string }> }
) {
  const ip = getClientIp(request);
  const rateLimit = limiter.check(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  try {
    const { debateId } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

    if (!debateId) {
      return NextResponse.json({ error: 'Debate ID required' }, { status: 400 });
    }

    const result = await d1.getDebate(debateId);

    if (!result.success || !result.debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    const debate = result.debate;
    const score = debate.score_data as Record<string, unknown> | null;
    const opponent = getOpponentById(debate.character as any);
    const opponentName =
      (debate.opponentStyle as string) || opponent?.name || 'AI Opponent';
    const topic = (debate.topic as string) || 'Debate';
    const messages = Array.isArray(debate.messages)
      ? (debate.messages as Array<{ role: string; content: string }>)
      : [];
    const messageCount = messages.length;

    const debateUrl = `${baseUrl}/debate/${debateId}`;
    const ogImageUrl = `${baseUrl}/api/og?debateId=${debateId}`;

    // Build share text
    let shareText: string;
    if (score) {
      const userScore = (score.userScore as number) ?? 0;
      const aiScore = (score.aiScore as number) ?? 0;
      const roastLevel = score.roastLevel as string;
      const verb = roastLevel === 'dominated' ? 'won against' : 'debated';
      shareText = `I just ${verb} ${opponentName} on "${topic}" (${userScore}-${aiScore})! Can you do better?`;
    } else {
      shareText = `I'm debating ${opponentName} on "${topic}" — come watch!`;
    }

    return NextResponse.json({
      debateId,
      url: debateUrl,
      ogImage: ogImageUrl,
      topic,
      opponent: opponentName,
      messageCount,
      score: score
        ? {
            userScore: (score.userScore as number) ?? 0,
            aiScore: (score.aiScore as number) ?? 0,
            roastLevel: score.roastLevel as string,
            verdict: score.verdict as string,
          }
        : null,
      shareText,
      // Platform-specific share URLs
      shareUrls: {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(debateUrl)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(debateUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(debateUrl)}`,
        reddit: `https://reddit.com/submit?url=${encodeURIComponent(debateUrl)}&title=${encodeURIComponent(shareText)}`,
      },
    });
  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate share data' },
      { status: 500 }
    );
  }
}
