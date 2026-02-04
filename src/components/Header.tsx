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
      <header className="sticky top-0 z-50 border-b border-[var(--border)]/30 bg-[var(--bg)]/50 backdrop-blur-xl">
        <div className="container-wide">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                <img 
                  src="/logo-icon.png" 
                  alt="DebateAI" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span className="text-[15px] font-semibold text-[var(--text)] tracking-tight">
                DebateAI
              </span>
            </Link>
            
            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <SignedIn>
                <Link
                  href="/history"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--bg-sunken)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  History
                </Link>

                {!isLoading && !isPremium && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--accent)] bg-[var(--accent-subtle)] hover:bg-[var(--accent-faint)] rounded-lg transition-colors ml-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                    </svg>
                    Upgrade
                  </button>
                )}
              </SignedIn>

              <div className="flex items-center gap-1 pl-2 ml-2 border-l border-[var(--border)]">
                <SignedIn>
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 rounded-lg"
                      }
                    }}
                  />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="btn btn-primary btn-sm">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
                
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </div>
      </header>

      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="button"
      />
    </>
  );
}
