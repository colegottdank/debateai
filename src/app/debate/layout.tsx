import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.debateai.org';

export const metadata: Metadata = {
  title: 'Start a Debate',
  description: 'Choose your opponent and topic. Challenge your beliefs against AI trained to argue from any perspective.',
  alternates: {
    canonical: `${BASE_URL}/debate`,
  },
  openGraph: {
    title: 'Start a Debate — DebateAI',
    description: 'Choose your opponent and topic. Challenge your beliefs against AI.',
    url: `${BASE_URL}/debate`,
    type: 'website',
  },
};

export default function DebateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
