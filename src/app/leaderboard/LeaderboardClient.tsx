'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Period = 'alltime' | 'weekly';
type Sort = 'points' | 'streak' | 'debates' | 'avg_score';

interface Entry {
  rank: number;
  userId: string;
  displayName: string | null;
  username: string | null;
  totalDebates: number;
  totalWins: number;
  currentStreak: number;
  longestStreak: number;
  avgScore: number;
  totalPoints: number;
}

const SORT_OPTIONS: { value: Sort; label: string; icon: string }[] = [
  { value: 'points', label: 'Points', icon: '⭐' },
  { value: 'streak', label: 'Streak', icon: '🔥' },
  { value: 'debates', label: 'Debates', icon: '💬' },
  { value: 'avg_score', label: 'Avg Score', icon: '📊' },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return (
    <span className="w-7 h-7 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center text-xs font-semibold text-[var(--text-secondary)] tabular-nums">
      {rank}
    </span>
  );
}

export default function LeaderboardClient() {
  const [period, setPeriod] = useState<Period>('alltime');
  const [sort, setSort] = useState<Sort>('points');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaderboard?period=${period}&sort=${sort}&limit=50`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setEntries(data.entries);
    } catch {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [period, sort]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Period toggle */}
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
          {(['alltime', 'weekly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
            >
              {p === 'alltime' ? 'All Time' : 'This Week'}
            </button>
          ))}
        </div>

        {/* Sort options */}
        <div className="flex gap-1.5 flex-wrap">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sort === opt.value
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/30'
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--error)]">{error}</p>
          <button onClick={fetchLeaderboard} className="mt-2 text-xs text-[var(--accent)] hover:underline">
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] animate-pulse">
              <div className="w-7 h-7 rounded-full bg-[var(--bg-sunken)]" />
              <div className="flex-1">
                <div className="h-4 bg-[var(--bg-sunken)] rounded w-32 mb-1" />
                <div className="h-3 bg-[var(--bg-sunken)] rounded w-20" />
              </div>
              <div className="h-5 bg-[var(--bg-sunken)] rounded w-14" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🏟️</div>
          <h3 className="text-base font-semibold text-[var(--text)] mb-1">No debaters yet</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {period === 'weekly'
              ? 'No debates completed this week. Be the first!'
              : 'Complete a debate to appear on the leaderboard.'}
          </p>
        </div>
      )}

      {/* Leaderboard entries */}
      {!loading && !error && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border transition-colors ${
                entry.rank <= 3
                  ? 'bg-[var(--accent)]/3 border-[var(--accent)]/15'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)]/50'
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 flex justify-center">
                <RankBadge rank={entry.rank} />
              </div>

              {/* Name + stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {entry.username ? (
                    <Link
                      href={`/profile/${entry.username}`}
                      className="text-sm font-semibold text-[var(--text)] hover:text-[var(--accent)] transition-colors truncate"
                    >
                      {entry.displayName || `Debater ${entry.userId.slice(-4)}`}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-[var(--text)] truncate">
                      {entry.displayName || `Debater ${entry.userId.slice(-4)}`}
                    </span>
                  )}
                  {entry.currentStreak > 0 && (
                    <span className="text-xs text-orange-500 font-medium flex items-center gap-0.5">
                      🔥 {entry.currentStreak}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mt-0.5">
                  <span>{entry.totalDebates} {entry.totalDebates === 1 ? 'debate' : 'debates'}</span>
                  <span>·</span>
                  <span>{entry.totalWins}W</span>
                  <span>·</span>
                  <span>Avg {entry.avgScore}</span>
                </div>
              </div>

              {/* Key stat (based on sort) */}
              <div className="flex-shrink-0 text-right">
                {sort === 'points' && (
                  <div>
                    <span className="text-sm font-bold text-[var(--accent)] tabular-nums">{entry.totalPoints}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] ml-1">pts</span>
                  </div>
                )}
                {sort === 'streak' && (
                  <div>
                    <span className="text-sm font-bold text-orange-500 tabular-nums">{entry.currentStreak}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] ml-1">day{entry.currentStreak !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {sort === 'debates' && (
                  <div>
                    <span className="text-sm font-bold text-[var(--accent)] tabular-nums">{entry.totalDebates}</span>
                  </div>
                )}
                {sort === 'avg_score' && (
                  <div>
                    <span className="text-sm font-bold text-[var(--accent)] tabular-nums">{entry.avgScore}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] ml-1">avg</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Points legend */}
      <div className="mt-8 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">How Points Work</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '✅', label: 'Complete', value: '+10' },
            { icon: '🏆', label: 'Win', value: '+5' },
            { icon: '🔥', label: 'Streak/day', value: '+2' },
            { icon: '📤', label: 'Share', value: '+3' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-lg mb-0.5">{item.icon}</div>
              <div className="text-xs font-semibold text-[var(--accent)]">{item.value}</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
