import type { Metadata } from 'next';
import { debateJsonLd } from '@/lib/jsonld';
import { getOpponentById } from '@/lib/opponents';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

// Fetch debate data from the public API
async function getPublicDebate(debateId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/public/debates/${debateId}`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!res.ok) {
      console.error(`Failed to fetch public debate ${debateId}, status: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.debate as Record<string, unknown>;
  } catch (error) {
    console.error('getPublicDebate: Failed to fetch:', error);
    return null;
  }
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ debateId: string }>;
}): Promise<Metadata> {
  const { debateId } = await params;
  const debate = await getPublicDebate(debateId);

  if (debate) {
    const topic = (debate.topic as string) || 'AI Debate';
    const opponent = getOpponentById(debate.opponent as any);
    const opponentName = (debate.opponentStyle as string) || opponent?.name || 'AI';

    return {
      title: `${topic} — Debate vs ${opponentName}`,
      description: `Read the full AI debate about "${topic}". ${opponentName} argues the opposing position on DebateAI.`,
      openGraph: {
        title: `${topic} — AI Debate`,
        description: `A public debate about "${topic}" on DebateAI.`,
        url: `${BASE_URL}/debates/${debateId}`,
        type: 'article',
        images: [{
          url: `${BASE_URL}/api/og?topic=${encodeURIComponent(topic)}&opponent=${encodeURIComponent(opponentName)}`,
          width: 1200,
          height: 630,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${topic} — AI Debate`,
        description: `A public debate about "${topic}" on DebateAI.`,
      },
    };
  }

  return {
    title: 'Public Debate',
    description: 'Read a public AI debate on DebateAI.',
  };
}

// Server component for the public read-only debate page
export default async function PublicDebatePage({
  params,
}: {
  params: Promise<{ debateId: string }>;
}) {
  const { debateId } = await params;
  const debate = await getPublicDebate(debateId);

  if (!debate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Debate Not Found</h1>
        <p className="text-[var(--text-secondary)]">This debate could not be loaded or may not exist.</p>
      </div>
    );
  }

  const messages = (debate.messages as Array<{ role: string; content: string }>) || [];
  const topic = (debate.topic as string) || 'Debate';
  const opponent = getOpponentById(debate.opponent as any);
  const opponentName = (debate.opponentStyle as string) || opponent?.name || 'AI Opponent';

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            debateJsonLd({
              id: debate.id as string,
              topic,
              opponentName,
              messages,
              createdAt: debate.created_at as string | undefined,
            })
          ),
        }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl">{topic}</h1>
          <p className="mt-4 text-xl text-[var(--text-secondary)]">
            A public debate vs. <strong>{opponentName}</strong>
          </p>
        </header>

        <div className="space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`p-4 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-[var(--user-bg)] text-[var(--user-text)]' : 'bg-[var(--ai-bg)] text-[var(--ai-text)]'}`}>
                <strong className="block mb-1 text-sm font-semibold">{msg.role === 'user' ? 'User' : opponentName}</strong>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
