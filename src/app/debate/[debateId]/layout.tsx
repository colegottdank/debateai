import type { Metadata } from 'next';
import { d1 } from '@/lib/d1';
import { opponents, getOpponentById } from '@/lib/opponents';

// Generate dynamic metadata for social sharing
export async function generateMetadata({ params }: { params: Promise<{ debateId: string }> }): Promise<Metadata> {
  try {
    const { debateId } = await params;
    const result = await d1.getDebate(debateId);
    
    if (result.success && result.debate?.score_data) {
      const score = result.debate.score_data as Record<string, unknown>;
      const opponent = getOpponentById(result.debate?.character as any);
      const opponentName = opponent?.name || 'AI Opponent';
      
      const title = (score.roastLevel as string) === 'dominated' 
        ? `I just won against ${opponentName} in a debate!`
        : `I debated ${opponentName} on this topic!`;
      
      const description = `Topic: "${result.debate.topic}". Score: ${score.userScore as number} vs ${score.aiScore as number}. Can you do better?`;
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.com';
      
      return {
        title: `${title} | DebateAI`,
        description,
        openGraph: {
          title,
          description,
          images: [`${baseUrl}/api/og?debateId=${debateId}`],
          type: 'website',
          url: `${baseUrl}/debate/${debateId}`,
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [`${baseUrl}/api/og?debateId=${debateId}`],
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  
  // Fallback metadata
  return {
    title: 'DebateAI - Master the Art of Debate',
    description: "Engage in intellectual discourse with AI opponents specialized in different debate styles.",
  };
}

export default function DebateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}