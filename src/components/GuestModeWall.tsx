'use client';

import { useState, useEffect } from 'react';
import { useSafeClerk } from '@/lib/useSafeClerk';
import { track } from '@/lib/analytics';

interface GuestModeWallProps {
  isOpen: boolean;
  messageCount: number;
  onClose?: () => void;
}

export default function GuestModeWall({ isOpen, messageCount, onClose }: GuestModeWallProps) {
  const { openSignIn } = useSafeClerk();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay for animation
      setTimeout(() => setIsVisible(true), 50);
      track('guest_mode_wall_shown', { messageCount });
    } else {
      setIsVisible(false);
    }
  }, [isOpen, messageCount]);

  if (!isOpen) return null;

  const handleSignUp = () => {
    track('guest_mode_sign_up_clicked', { messageCount });
    openSignIn();
  };

  const handleContinueAsGuest = () => {
    track('guest_mode_continue_clicked', { messageCount });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleContinueAsGuest}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-2xl p-6 sm:p-8 transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleContinueAsGuest}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--bg-sunken)] transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content - Curiosity Gap Version (Option A) */}
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-light)]/10 flex items-center justify-center">
            <span className="text-3xl">🔥</span>
          </div>

          {/* Headline */}
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-3">
            You&apos;re on fire.
          </h2>

          {/* Curiosity gap copy */}
          <p className="text-[var(--text-secondary)] mb-2">
            847 people are debating this topic right now.
          </p>
          <p className="text-[var(--text-secondary)] mb-6">
            The best argument just dropped — and it&apos;s not yours.
          </p>

          {/* Value props */}
          <div className="space-y-2.5 mb-6 text-left">
            <div className="flex items-center gap-3 text-sm text-[var(--text)]">
              <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>See the counter-argument that changed 12 minds</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--text)]">
              <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save your debates and track your win rate</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--text)]">
              <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Challenge friends and climb the leaderboard</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleSignUp}
            className="w-full py-3 px-6 rounded-xl bg-[var(--accent)] text-white font-semibold shadow-lg shadow-[var(--accent)]/25 hover:shadow-xl hover:shadow-[var(--accent)]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            See What You&apos;re Missing →
          </button>

          {/* Secondary CTA */}
          <button
            onClick={handleContinueAsGuest}
            className="mt-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Continue as guest (limited)
          </button>
        </div>
      </div>
    </div>
  );
}
