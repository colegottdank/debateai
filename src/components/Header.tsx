'use client';

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
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
  );
}