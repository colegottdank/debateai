'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────

interface AdminStats {
  totalDebates: number;
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  conversionRate: number;
  debatesToday: number;
  debatesThisWeek: number;
  debatesThisMonth: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  avgMessagesPerDebate: number;
  totalMessages: number;
  debatesWithMultipleRounds: number;
  premiumDebatesToday: number;
  freeDebatesToday: number;
  churningUsers: number;
  completionRate: number;
  scoredDebates: number;
  activeStreaks: number;
  emailSubscribers: number;
  topTopics: Array<{ topic: string; count: number }>;
  topOpponents: Array<{ opponent: string; count: number }>;
  dailyTrend: Array<{ date: string; debates: number; users: number }>;
  generatedAt: string;
  cached: boolean;
}

// ── Component ────────────────────────────────────────────────────

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStats = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.status === 401 || res.status === 403) {
        setError('Access denied. Admin credentials required.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(true);
    const interval = setInterval(() => fetchStats(false), 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // ── Error / Loading states ─────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-[var(--text)] mb-2">Access Denied</h1>
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          <Link href="/" className="inline-block mt-6 text-sm text-[var(--accent)] hover:underline">
            ← Back to DebateAI
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-48 bg-[var(--bg-sunken)] rounded animate-pulse mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-[var(--bg-sunken)] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">📊 Admin Dashboard</h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {stats.cached ? '📦 Cached' : '🔄 Fresh'} · Updated {lastRefresh ? formatTime(lastRefresh) : '—'} · Auto-refreshes every 60s
            </p>
          </div>
          <button
            onClick={() => fetchStats(true)}
            className="self-start px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-sunken)] transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* KPI Cards — Row 1: Core Volume */}
        <SectionTitle title="Core Metrics" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <MetricCard label="Total Debates" value={stats.totalDebates} icon="💬" />
          <MetricCard label="Today" value={stats.debatesToday} icon="📅" highlight />
          <MetricCard label="This Week" value={stats.debatesThisWeek} icon="📆" />
          <MetricCard label="This Month" value={stats.debatesThisMonth} icon="🗓️" />
          <MetricCard label="Scored" value={stats.scoredDebates} icon="✅" subtitle={`${stats.completionRate}% rate`} />
        </div>

        {/* KPI Cards — Row 2: Users */}
        <SectionTitle title="Users" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <MetricCard label="Total Users" value={stats.totalUsers} icon="👥" />
          <MetricCard label="DAU" value={stats.activeUsersToday} icon="🟢" highlight />
          <MetricCard label="WAU" value={stats.activeUsersThisWeek} icon="📊" />
          <MetricCard label="Premium" value={stats.premiumUsers} icon="⭐" subtitle={`${stats.conversionRate}% conv`} />
          <MetricCard label="Churning" value={stats.churningUsers} icon="⚠️" warn={stats.churningUsers > 0} />
        </div>

        {/* KPI Cards — Row 3: Engagement & Retention */}
        <SectionTitle title="Engagement & Retention" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <MetricCard label="Avg Messages" value={stats.avgMessagesPerDebate} icon="💬" decimal />
          <MetricCard label="Multi-Round" value={stats.debatesWithMultipleRounds} icon="🔁" subtitle={`of ${stats.totalDebates}`} />
          <MetricCard label="Active Streaks" value={stats.activeStreaks} icon="🔥" />
          <MetricCard label="Email Subs" value={stats.emailSubscribers} icon="📧" />
          <MetricCard label="Total Messages" value={stats.totalMessages} icon="📝" />
        </div>

        {/* KPI Cards — Row 4: Revenue */}
        <SectionTitle title="Revenue Signals" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <MetricCard label="Free Debates (Today)" value={stats.freeDebatesToday} icon="🆓" />
          <MetricCard label="Premium Debates (Today)" value={stats.premiumDebatesToday} icon="💎" />
          <MetricCard label="Free Users" value={stats.freeUsers} icon="👤" />
          <MetricCard label="Conversion Rate" value={`${stats.conversionRate}%`} icon="📈" />
        </div>

        {/* Daily Trend */}
        <SectionTitle title="7-Day Trend" />
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-4 sm:p-6 mb-8">
          {stats.dailyTrend.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-2">
              {/* Chart header */}
              <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-3">
                <span>Date</span>
                <div className="flex gap-6">
                  <span>Debates</span>
                  <span>Users</span>
                </div>
              </div>
              {stats.dailyTrend.map((day) => {
                const maxDebates = Math.max(...stats.dailyTrend.map((d) => d.debates), 1);
                const barWidth = (day.debates / maxDebates) * 100;
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-tertiary)] w-20 shrink-0">
                      {formatDate(day.date)}
                    </span>
                    <div className="flex-1 h-6 bg-[var(--bg-sunken)] rounded-md overflow-hidden relative">
                      <div
                        className="h-full bg-[var(--accent)] rounded-md transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                      <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-[var(--text)]">
                        {day.debates}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] w-12 text-right shrink-0">
                      {day.users} 👤
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Content — Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Top Topics */}
          <div>
            <SectionTitle title="Top Topics" />
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-4">
              {stats.topTopics.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-6">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {stats.topTopics.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-[var(--text-tertiary)] w-5 shrink-0">#{i + 1}</span>
                        <span className="text-sm text-[var(--text)] truncate">{t.topic}</span>
                      </div>
                      <span className="text-xs font-medium text-[var(--text-secondary)] shrink-0 tabular-nums">
                        {t.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Opponents */}
          <div>
            <SectionTitle title="Top Opponents" />
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-4">
              {stats.topOpponents.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-6">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {stats.topOpponents.map((o, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-[var(--text-tertiary)] w-5 shrink-0">#{i + 1}</span>
                        <span className="text-sm text-[var(--text)] truncate">{o.opponent}</span>
                      </div>
                      <span className="text-xs font-medium text-[var(--text-secondary)] shrink-0 tabular-nums">
                        {o.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-tertiary)]">
            Generated {stats.generatedAt ? new Date(stats.generatedAt).toLocaleString() : '—'}
          </p>
          <Link href="/" className="text-xs text-[var(--accent)] hover:underline mt-1 inline-block">
            ← Back to DebateAI
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{title}</h2>;
}

function MetricCard({
  label,
  value,
  icon,
  subtitle,
  highlight,
  warn,
  decimal,
}: {
  label: string;
  value: number | string;
  icon: string;
  subtitle?: string;
  highlight?: boolean;
  warn?: boolean;
  decimal?: boolean;
}) {
  const formatted = typeof value === 'number'
    ? decimal
      ? value.toFixed(1)
      : value.toLocaleString()
    : value;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        warn
          ? 'border-red-500/30 bg-red-500/5'
          : highlight
            ? 'border-[var(--accent)]/30 bg-[var(--accent-subtle)]'
            : 'border-[var(--border)] bg-[var(--bg-raised)]'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wide leading-tight">{label}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${warn ? 'text-red-400' : 'text-[var(--text)]'}`}>
        {formatted}
      </p>
      {subtitle && (
        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
