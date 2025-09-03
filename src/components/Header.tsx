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
      <header className="border-b border-slate-700 bg-slate-900 flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <img 
                src="/favicon-512.png" 
                alt="DebateAI" 
                className="w-[34px] h-[34px]"
              />
              <span className="text-lg font-medium text-slate-100">
                DebateAI
              </span>
            </Link>
            
            <nav className="flex items-center gap-4">
              {/* Upgrade Button for Free Users */}
              <SignedIn>
                {!isLoading && !isPremium && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    Upgrade
                  </button>
                )}
              </SignedIn>

              {/* Auth */}
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-slate-100 hover:text-slate-200 transition-colors text-sm">
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