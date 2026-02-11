'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';

type Sort = 'recent' | 'top_scored' | 'most_messages';

interface DebateCard {
  id: string;
  topic: string;
  opponent: string | null;
  messageCount: number;
  previewMessage: string;
  userScore: number | null;
  aiScore: number | null;
  winner: 'user' | 'ai' | 'draw' | null;
  summary: string | null;
  createdAt: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const SORT_OPTIONS: { value: Sort; label: string; icon: string }[] = [
  { value: 'recent', label: 'Recent', icon: '🕐' },
  { value: 'top_scored', label: 'Top Scored', icon: '⭐' },
  { value: 'most_messages', label: 'Most Messages', icon: '💬' },
];

function WinnerBadge({ winner }: { winner: 'user' | 'ai' | 'draw' | null }) {
  if (!winner) return null;
  const config = {
    user: { emoji: '🏆', label: 'User won', cls: 'text-green-600 dark:text-green-400 bg-green-500/10' },
    ai: { emoji: '🤖', label: 'AI won', cls: 'text-orange-600 dark:text-orange-400 bg-orange-500/10' },
    draw: { emoji: '🤝', label: 'Draw', cls: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
  };
  const c = config[winner];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.cls}`}>
      {c.emoji} {c.label}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ExploreClient() {
  const [sort, setSort] = useState<Sort>('recent');
  const [debates, setDebates] = useState<DebateCard[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebates = useCallback(
    async (offset = 0, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const res = await fetch(`/api/explore?sort=${sort}&limit=20&offset=${offset}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();

        if (append) {
          setDebates((prev) => [...prev, ...data.debates]);
        } else {
          setDebates(data.debates);
        }
        setPagination(data.pagination);
      } catch {
        setError('Failed to load debates');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort],
  );

  useEffect(() => {
    fetchDebates(0, false);
  }, [fetchDebates]);

  const handleCardClick = (debate: DebateCard) => {
    track('explore_debate_viewed', {
      debateId: debate.id,
      topic: debate.topic,
      source: 'explore',
    });
  };

  return (
    <div>
      {/* Sort controls */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
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

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--error)]">{error}</p>
          <button
            onClick={() => fetchDebates(0, false)}
            className="mt-2 text-xs text-[var(--accent)] hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 animate-pulse"
            >
              <div className="h-5 bg-[var(--bg-sunken)] rounded w-3/4 mb-3" />
              <div className="h-3 bg-[var(--bg-sunken)] rounded w-1/2 mb-2" />
              <div className="h-3 bg-[var(--bg-sunken)] rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && debates.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🏟️</div>
          <h3 className="text-base font-semibold text-[var(--text)] mb-1">No debates yet</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Be the first to complete a debate and appear here!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Start a Debate →
          </Link>
        </div>
      )}

      {/* Debate cards */}
      {!loading && !error && debates.length > 0 && (
        <div className="space-y-3">
          {debates.map((debate) => (
            <Link
              key={debate.id}
              href={`/debate/${debate.id}`}
              onClick={() => handleCardClick(debate)}
              className="block group"
            >
              <div className="rounded-xl border border-[var(--border)]/50 bg-[var(--bg-elevated)] p-4 sm:p-5 transition-all hover:border-[var(--accent)]/30 hover:shadow-md">
                {/* Top row: topic + winner badge */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm sm:text-base font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors leading-snug flex-1">
                    {debate.topic}
                  </h3>
                  <WinnerBadge winner={debate.winner} />
                </div>

                {/* Preview text */}
                {debate.previewMessage && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
                    &ldquo;{debate.previewMessage}&rdquo;
                  </p>
                )}

                {/* Meta row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
                    {debate.opponent && (
                      <span>vs {debate.opponent}</span>
                    )}
                    <span>{debate.messageCount} messages</span>
                    {debate.userScore != null && debate.aiScore != null && (
                      <span className="font-medium">
                        {debate.userScore}–{debate.aiScore}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    {timeAgo(debate.createdAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Load more */}
      {pagination?.hasMore && !loading && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchDebates(pagination.offset + pagination.limit, true)}
            disabled={loadingMore}
            className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--accent)]/30 transition-all disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading…
              </span>
            ) : (
              `Show more (${pagination.total - pagination.offset - pagination.limit} remaining)`
            )}
          </button>
        </div>
      )}

      {/* CTA at bottom */}
      {!loading && debates.length > 0 && (
        <div className="mt-8 text-center p-6 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5">
          <h3 className="text-base font-semibold text-[var(--text)] mb-1">
            Ready to debate?
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            Pick today&apos;s topic and make your case.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent)]/25 transition-all hover:-translate-y-0.5"
          >
            Start Debating
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
