'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import ThemeToggle from './ThemeToggle';
import UpgradeModal from './UpgradeModal';
import { useSubscription } from '@/lib/useSubscription';

export default function Header() {
  const { isPremium, isLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <>
      <header className="border-b flex-shrink-0 sticky top-0 z-50 backdrop-blur-xl" style={{ 
        borderColor: 'var(--border-subtle)',
        background: 'var(--bg-secondary)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="logo-icon">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                DebateAI
              </span>
            </Link>
            
            <nav className="flex items-center gap-4">
              {/* Upgrade Button for Free Users */}
              <SignedIn>
                {!isLoading && !isPremium && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-sm font-medium transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Upgrade
                  </button>
                )}
              </SignedIn>

              {/* Auth */}
              <SignedIn>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8'
                    }
                  }}
                />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button 
                    className="text-sm font-medium transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              
              {/* Theme Toggle */}
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="button"
      />
    </>
  );
}