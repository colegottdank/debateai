import { Metadata } from 'next';
import ExploreClient from './ExploreClient';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Explore Debates — DebateAI',
  description:
    'Browse recent and top-scoring AI debates. Read full transcripts, discover hot topics, and jump into your own debate.',
  openGraph: {
    title: 'Explore Debates — DebateAI',
    description:
      'Browse recent and top-scoring AI debates. Read transcripts and discover hot topics.',
  },
};

export default function ExplorePage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1 px-5 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 animate-fade-up">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text)] mb-2">
              Explore Debates
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              Browse real debates, read transcripts, and discover your next topic.
            </p>
          </div>
          <ExploreClient />
        </div>
      </main>
    </div>
  );
}
