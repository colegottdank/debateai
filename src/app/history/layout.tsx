import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

export const metadata: Metadata = {
  title: 'Debate History',
  description: 'Review your past debates and continue where you left off. Track your argumentation progress on DebateAI.',
  alternates: {
    canonical: `${BASE_URL}/history`,
  },
  openGraph: {
    title: 'Your Debate History — DebateAI',
    description: 'Review your past debates and continue where you left off.',
    url: `${BASE_URL}/history`,
    type: 'website',
  },
  robots: {
    index: false, // Don't index user-specific pages
    follow: true,
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
