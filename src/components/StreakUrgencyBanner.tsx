'use client';

import { useState, useEffect } from 'react';
import { useSafeUser } from '@/lib/useSafeClerk';

/**
 * Urgency banner: "Your X-day streak ends in Y hours!"
 * Only shows for signed-in users who have a streak > 1 and haven't debated today.
 */
export default function StreakUrgencyBanner() {
  const { isSignedIn } = useSafeUser();
  const [show, setShow] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    if (!isSignedIn) return;

    const fetchStreak = async () => {
      try {
        const res = await fetch('/api/user/streak');
        if (!res.ok) return;
        const data = await res.json();

        // Only show if streak > 1 and NOT debated today
        if (data.currentStreak > 1 && !data.debatedToday) {
          setStreakCount(data.currentStreak);

          // Calculate hours until midnight UTC
          const now = new Date();
          const midnight = new Date(now);
          midnight.setUTCDate(midnight.getUTCDate() + 1);
          midnight.setUTCHours(0, 0, 0, 0);
          const hours = Math.ceil((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
          setHoursLeft(hours);
          setShow(true);
        }
      } catch {
        // Silently fail
      }
    };

    fetchStreak();
  }, [isSignedIn]);

  if (!show) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mb-4 animate-fade-up">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <span className="text-lg">🔥</span>
        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium flex-1">
          Your {streakCount}-day streak ends in {hoursLeft} {hoursLeft === 1 ? 'hour' : 'hours'}!
        </p>
        <button
          onClick={() => {
            // Scroll to input area
            document.querySelector('[data-onboarding="input"]')?.scrollIntoView({ behavior: 'smooth' });
            (document.querySelector('[data-onboarding="input"] textarea') as HTMLTextAreaElement)?.focus();
          }}
          className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors whitespace-nowrap"
        >
          Debate now →
        </button>
      </div>
    </div>
  );
}
