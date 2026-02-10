'use client';

import Link from 'next/link';
import Header from '@/components/Header';

interface HistoryEntry {
  date: string;
  topic: string;
  persona: string;
  category: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  philosophy: '🧠',
  ethics: '⚖️',
  technology: '💻',
  society: '🏙️',
  science: '🔬',
  relationships: '💬',
  business: '💼',
  'pop-culture': '🎬',
  'hot-takes': '🔥',
  politics: '🏛️',
  general: '💡',
};

export default function TopicHistoryClient({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />

      <main className="flex-1 px-5 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--accent)] opacity-50" />
              <span className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-[0.2em]">
                Topic History
              </span>
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--accent)] opacity-50" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[var(--text)] mb-3 leading-tight">
              Past Daily Debates
            </h1>
            <p className="text-base text-[var(--text-secondary)] max-w-md mx-auto">
              Missed a day? Revisit any past daily topic and start a debate.
            </p>
          </div>

          {/* History list */}
          {history.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]/30 flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
                No history yet
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Daily topic rotation hasn&apos;t started yet. Check back tomorrow!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                Start Today&apos;s Debate
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, i) => {
                const dateObj = new Date(entry.date + 'T12:00:00');
                const isToday = entry.date === new Date().toISOString().split('T')[0];
                const emoji = CATEGORY_EMOJI[entry.category] ?? '💡';

                return (
                  <div
                    key={entry.date}
                    className={`
                      group rounded-xl border p-4 sm:p-5 transition-all
                      ${isToday
                        ? 'border-[var(--accent)]/30 bg-[var(--accent)]/5'
                        : 'border-[var(--border)]/30 bg-[var(--bg-elevated)]/50 hover:border-[var(--accent)]/20'
                      }
                    `}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Date column */}
                      <div className="shrink-0 text-center w-14">
                        <div className="text-xs text-[var(--text-secondary)] uppercase">
                          {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-2xl font-bold text-[var(--text)]">
                          {dateObj.getDate()}
                        </div>
                        {isToday && (
                          <span className="text-[10px] font-semibold text-[var(--accent)] uppercase">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{emoji}</span>
                          <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                            {entry.category}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-[var(--text)] mb-1 leading-snug">
                          {entry.topic}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                          vs. <span className="font-medium text-[var(--accent)]">{entry.persona}</span>
                        </p>
                      </div>

                      {/* Action */}
                      <Link
                        href={`/?topic=${encodeURIComponent(entry.topic)}&persona=${encodeURIComponent(entry.persona)}`}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors"
                      >
                        Debate
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Today&apos;s Debate
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
