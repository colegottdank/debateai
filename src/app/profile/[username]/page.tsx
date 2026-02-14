import type { Metadata } from 'next';
import { getPublicProfile } from '@/lib/profiles';
import Header from '@/components/Header';
import ProfileClient from './ProfileClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.debateai.org';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    return { title: 'Profile Not Found — DebateAI' };
  }

  const winRate = profile.totalDebates > 0
    ? Math.round((profile.totalWins / profile.totalDebates) * 100)
    : 0;

  const description = `${profile.displayName} has debated ${profile.totalDebates} times with a ${winRate}% win rate on DebateAI.${profile.bio ? ` "${profile.bio}"` : ''}`;

  return {
    title: `${profile.displayName} — DebateAI Profile`,
    description,
    openGraph: {
      title: `${profile.displayName} on DebateAI`,
      description,
      url: `${BASE_URL}/profile/${username}`,
      type: 'profile',
      images: [{
        url: `${BASE_URL}/api/og?profile=${encodeURIComponent(profile.displayName)}&debates=${profile.totalDebates}&wins=${profile.totalWins}&streak=${profile.currentStreak}`,
        width: 1200,
        height: 630,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.displayName} on DebateAI`,
      description,
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1 px-5 py-8">
        <div className="max-w-3xl mx-auto">
          <ProfileClient initialProfile={profile} username={username} />
        </div>
      </main>
    </div>
  );
}
