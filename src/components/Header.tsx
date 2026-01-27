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
      <header className="sticky top-0 z-50 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              DebateAI
            </span>
          </Link>
          
          <nav className="flex items-center gap-2">
            <Link 
              href="/debate" 
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Topics
            </Link>
            <Link 
              href="/history" 
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              History
            </Link>
            
            <div className="w-px h-5 bg-white/10 mx-2" />
            
            {/* Upgrade Button for Free Users */}
            <SignedIn>
              {!isLoading && !isPremium && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
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
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            
            {/* Theme Toggle */}
            <ThemeToggle />
          </nav>
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
