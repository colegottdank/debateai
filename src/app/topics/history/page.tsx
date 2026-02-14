import type { Metadata } from 'next';
import { getTopicHistory } from '@/lib/daily-topics-db';
import TopicHistoryClient from './TopicHistoryClient';

export const runtime = 'nodejs';
export const revalidate = 300; // 5-minute ISR

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.debateai.org';

export const metadata: Metadata = {
  title: 'Daily Topic History',
  description:
    'Browse past daily debate topics on DebateAI. Revisit any topic and challenge the AI to a debate.',
  openGraph: {
    title: 'Daily Topic History | DebateAI',
    description:
      'Browse past daily debate topics on DebateAI. Revisit any topic and challenge the AI.',
    url: `${BASE_URL}/topics/history`,
    images: [{ url: `${BASE_URL}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Topic History | DebateAI',
    description: 'Browse past daily debate topics on DebateAI.',
    images: [`${BASE_URL}/api/og`],
  },
  alternates: {
    canonical: `${BASE_URL}/topics/history`,
  },
};

interface HistoryEntry {
  date: string;
  topic: string;
  persona: string;
  category: string;
}

export default async function TopicHistoryPage() {
  let history: HistoryEntry[] = [];

  try {
    const dbHistory = await getTopicHistory(60);
    history = dbHistory.map((h) => ({
      date: h.shown_date,
      topic: h.topic ?? '',
      persona: h.persona ?? '',
      category: h.category ?? 'general',
    }));
  } catch {
    // D1 unavailable — page renders with empty state
  }

  return <TopicHistoryClient history={history} />;
}
