'use client';

import React, { useEffect } from 'react';
import { useSafeClerk } from '@/lib/useSafeClerk';
import { track } from '@/lib/analytics';

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  turnCount: number;
}

export default function GuestLimitModal({ isOpen, onClose, turnCount }: GuestLimitModalProps) {
  const { openSignIn } = useSafeClerk();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      track('guest_limit_modal_shown', { turnCount });
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, turnCount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div 
          className="w-full max-w-md bg-[var(--bg-elevated)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden animate-fade-scale"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
              Enjoying the debate?
            </h2>
            <p className="text-sm text-[var(--text-secondary)] px-4">
              You&apos;ve exchanged {turnCount} messages as a guest. Sign up to continue this conversation and save your progress.
            </p>
          </div>

          {/* Benefits */}
          <div className="px-6 pb-6">
            <div className="bg-[var(--bg-sunken)] rounded-xl p-4 mb-6 border border-[var(--border-light)]">
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-[var(--text)]">
                  <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save your debate history</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[var(--text)]">
                  <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unlimited messages</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[var(--text)]">
                  <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Access advanced AI personas</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  track('guest_limit_signup_clicked', { turnCount });
                  openSignIn({ afterSignInUrl: window.location.href });
                }}
                className="w-full h-12 rounded-xl bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] hover:shadow-lg hover:shadow-[var(--accent)]/20 active:translate-y-0.5 transition-all duration-200"
              >
                Sign Up to Continue
              </button>
              
              <button
                onClick={onClose}
                className="w-full h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-sunken)] hover:text-[var(--text)] transition-colors"
              >
                Maybe later
              </button>
            </div>
            
            <p className="text-center text-xs text-[var(--text-tertiary)] mt-4">
              Takes less than 10 seconds. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
