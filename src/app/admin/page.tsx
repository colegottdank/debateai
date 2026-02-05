"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Header from "@/components/Header";

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
  topTopics: Array<{ topic: string; count: number }>;
  topOpponents: Array<{ opponent: string; count: number }>;
  dailyTrend: Array<{ date: string; debates: number; users: number }>;
  generatedAt: string;
  cached: boolean;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4">
      <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-[var(--text)]">{value}</div>
      {sub && <div className="text-xs text-[var(--text-tertiary)] mt-1">{sub}</div>}
    </div>
  );
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full h-1.5 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
      <div
        className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function AdminPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      if (res.status === 401) {
        setError("Not signed in. Please sign in to access admin.");
        return;
      }
      if (res.status === 403) {
        setError("Access denied. Admin only.");
        return;
      }
      if (!res.ok) {
        setError("Failed to load stats.");
        return;
      }
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchStats();
    } else if (isLoaded && !isSignedIn) {
      setError("Not signed in.");
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchStats]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!isSignedIn) return;
    const interval = setInterval(fetchStats, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isSignedIn, fetchStats]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--text-secondary)]">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <div className="text-[var(--text)] font-semibold mb-2">{error}</div>
            <Link href="/" className="text-sm text-[var(--accent)] hover:underline">← Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const trendMax = Math.max(...stats.dailyTrend.map((d) => d.debates), 1);

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)]">
      <Header />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Admin Dashboard</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {stats.cached ? "Cached" : "Live"} · {new Date(stats.generatedAt).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors cursor-pointer"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Debates" value={stats.totalDebates.toLocaleString()} />
          <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} />
          <StatCard
            label="Premium Users"
            value={stats.premiumUsers}
            sub={`${stats.conversionRate}% conversion`}
          />
          <StatCard label="Avg Msgs/Debate" value={stats.avgMessagesPerDebate} />
        </div>

        {/* Activity */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Debates Today" value={stats.debatesToday} />
          <StatCard label="This Week" value={stats.debatesThisWeek} />
          <StatCard label="This Month" value={stats.debatesThisMonth} />
          <StatCard label="Active Users Today" value={stats.activeUsersToday} />
        </div>

        {/* Engagement + Revenue */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Messages" value={stats.totalMessages.toLocaleString()} />
          <StatCard
            label="Multi-Round Debates"
            value={stats.debatesWithMultipleRounds}
            sub={stats.totalDebates > 0
              ? `${Math.round((stats.debatesWithMultipleRounds / stats.totalDebates) * 100)}% of total`
              : "—"}
          />
          <StatCard label="Premium Debates Today" value={stats.premiumDebatesToday} />
          <StatCard
            label="Churning Users"
            value={stats.churningUsers}
            sub="Cancel pending"
          />
        </div>

        {/* 7-Day Trend */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">7-Day Trend</h2>
          {stats.dailyTrend.length === 0 ? (
            <div className="text-xs text-[var(--text-tertiary)] py-4 text-center">No data yet</div>
          ) : (
            <div className="space-y-2">
              {stats.dailyTrend.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-secondary)] w-20 flex-shrink-0">
                    {new Date(day.date + "T00:00:00Z").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex-1">
                    <MiniBar value={day.debates} max={trendMax} />
                  </div>
                  <span className="text-xs text-[var(--text)] w-16 text-right">
                    {day.debates} debates
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)] w-14 text-right">
                    {day.users} users
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Topics + Top Opponents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Top Topics</h2>
            {stats.topTopics.length === 0 ? (
              <div className="text-xs text-[var(--text-tertiary)] py-2">No data</div>
            ) : (
              <div className="space-y-2">
                {stats.topTopics.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-tertiary)] w-4">{i + 1}.</span>
                    <span className="text-xs text-[var(--text)] flex-1 truncate">{t.topic}</span>
                    <span className="text-xs text-[var(--text-secondary)] font-mono">{t.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Top Opponents</h2>
            {stats.topOpponents.length === 0 ? (
              <div className="text-xs text-[var(--text-tertiary)] py-2">No data</div>
            ) : (
              <div className="space-y-2">
                {stats.topOpponents.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-tertiary)] w-4">{i + 1}.</span>
                    <span className="text-xs text-[var(--text)] flex-1 truncate">{o.opponent}</span>
                    <span className="text-xs text-[var(--text-secondary)] font-mono">{o.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
