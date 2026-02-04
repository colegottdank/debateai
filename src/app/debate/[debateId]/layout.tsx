import type { Metadata } from 'next';
import { d1 } from '@/lib/d1';
import { getOpponentById } from '@/lib/opponents';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

// Generate dynamic metadata for ALL debates — not just scored ones
export async function generateMetadata({ params }: { params: Promise<{ debateId: string }> }): Promise<Metadata> {
  try {
    const { debateId } = await params;
    const result = await d1.getDebate(debateId);

    if (result.success && result.debate) {
      const debate = result.debate;
      const score = debate.score_data as Record<string, unknown> | null;
      const opponent = getOpponentById(debate.character as any);
      const opponentName =
        (debate.opponentStyle as string) || opponent?.name || 'AI Opponent';
      const topic = (debate.topic as string) || 'Debate';
      const debateUrl = `${BASE_URL}/debate/${debateId}`;
      const ogImage = `${BASE_URL}/api/og?debateId=${debateId}`;

      // Build title based on whether debate is scored
      let title: string;
      let description: string;

      if (score) {
        // Scored debate — show result
        const roastLevel = score.roastLevel as string;
        title =
          roastLevel === 'dominated'
            ? `I won against ${opponentName}!`
            : `I debated ${opponentName}!`;
        description = `Topic: "${topic}". Score: ${score.userScore ?? 0} vs ${score.aiScore ?? 0}. Can you do better?`;
      } else {
        // In-progress or unscored debate — show topic + first argument snippet
        title = `${topic} — vs ${opponentName}`;
        const messages = Array.isArray(debate.messages)
          ? (debate.messages as Array<{ role: string; content: string }>)
          : [];
        const firstUserMsg = messages.find((m) => m.role === 'user');
        if (firstUserMsg?.content) {
          const snippet =
            firstUserMsg.content.length > 150
              ? firstUserMsg.content.slice(0, 147) + '...'
              : firstUserMsg.content;
          description = `"${snippet}" — Debate on DebateAI`;
        } else {
          description = `A debate about "${topic}" vs ${opponentName}. Join the conversation on DebateAI.`;
        }
      }

      return {
        title: `${title} | DebateAI`,
        description,
        alternates: {
          canonical: debateUrl,
        },
        openGraph: {
          title,
          description,
          images: [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: `Debate: ${topic}`,
            },
          ],
          type: 'article',
          url: debateUrl,
          siteName: 'DebateAI',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [ogImage],
          site: '@debateai',
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  // Fallback for debates that don't exist or D1 failure
  return {
    title: 'DebateAI — Challenge Your Convictions',
    description:
      'Engage in intellectual discourse with AI opponents. Sharpen your critical thinking through rigorous debate.',
    alternates: {
      canonical: `${BASE_URL}/debate`,
    },
  };
}

export default function DebateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
