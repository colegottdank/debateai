'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Preferences {
  streakWarning: boolean;
  challenge: boolean;
  scoreResult: boolean;
  milestone: boolean;
}

const PREF_INFO: { key: keyof Preferences; label: string; description: string; icon: string }[] = [
  {
    key: 'scoreResult',
    label: 'Debate Scored',
    description: 'When your debate is scored and results are ready',
    icon: '📊',
  },
  {
    key: 'streakWarning',
    label: 'Streak Warning',
    description: 'When your streak is about to expire (2h before midnight UTC)',
    icon: '⚠️',
  },
  {
    key: 'milestone',
    label: 'Streak Milestones',
    description: 'When you hit 7, 14, 30, 60, or 100-day streaks',
    icon: '🔥',
  },
  {
    key: 'challenge',
    label: 'Challenges',
    description: 'When someone challenges you to a debate',
    icon: '⚔️',
  },
];

export default function NotificationSettingsClient() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/notifications/preferences');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setPrefs(data.preferences);
      } catch {
        setError('Failed to load notification preferences');
      }
    }
    load();
  }, []);

  const toggle = async (key: keyof Preferences) => {
    if (!prefs) return;
    setSaving(key);
    setError(null);

    const newValue = !prefs[key];
    // Optimistic update
    setPrefs({ ...prefs, [key]: newValue });

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setPrefs(data.preferences);
    } catch {
      // Revert on failure
      setPrefs({ ...prefs, [key]: !newValue });
      setError('Failed to update preference');
    } finally {
      setSaving(null);
    }
  };

  if (error && !prefs) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-[var(--bg-sunken)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {PREF_INFO.map(({ key, label, description, icon }) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] hover:border-[var(--border-hover)] transition-colors"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">{icon}</span>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">{label}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{description}</p>
            </div>
          </div>

          <button
            onClick={() => toggle(key)}
            disabled={saving === key}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:opacity-50 ${
              prefs[key] ? 'bg-[var(--accent)]' : 'bg-[var(--bg-sunken)]'
            }`}
            role="switch"
            aria-checked={prefs[key]}
            aria-label={`Toggle ${label}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                prefs[key] ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}

      <div className="pt-6 border-t border-[var(--border)] mt-6">
        <Link
          href="/"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
        >
          ← Back to DebateAI
        </Link>
      </div>
    </div>
  );
}
