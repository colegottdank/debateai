'use client';

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDailyDebate } from '@/lib/daily-debates';
import Header from '@/components/Header';
import UpgradeModal from '@/components/UpgradeModal';
import { useSubscription } from '@/lib/useSubscription';

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { isPremium, debatesUsed, debatesLimit } = useSubscription();
  const [dailyDebate, setDailyDebate] = useState<{ persona: string; topic: string; description?: string } | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const debate = getDailyDebate();
    setDailyDebate(debate);
  }, []);

  useEffect(() => {
    if (!isSignedIn || !dailyDebate) return;
    
    const pendingDebateStr = sessionStorage.getItem('pendingDebate');
    if (!pendingDebateStr) return;
    
    try {
      const pendingDebate = JSON.parse(pendingDebateStr);
      if (pendingDebate.fromLandingPage) {
        sessionStorage.removeItem('pendingDebate');
        setUserInput(pendingDebate.userInput);
        setIsStarting(true);
        
        const createPendingDebate = async () => {
          const debateId = crypto.randomUUID();
          
          try {
            const response = await fetch('/api/debate/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                character: 'custom',
                opponentStyle: pendingDebate.persona,
                topic: pendingDebate.topic,
                debateId
              })
            });
            
            if (response.ok) {
              sessionStorage.setItem('firstArgument', pendingDebate.userInput);
              sessionStorage.setItem('isInstantDebate', 'true');
              router.push(`/debate/${debateId}`);
            } else {
              const error = await response.json();
              if (response.status === 429 && error.error === 'debate_limit_exceeded') {
                setShowUpgradeModal(true);
              } else {
                alert('Failed to start debate. Please try again.');
              }
              setIsStarting(false);
            }
          } catch (error) {
            console.error('Error creating pending debate:', error);
            alert('Failed to start debate. Please try again.');
            setIsStarting(false);
          }
        };
        
        createPendingDebate();
      }
    } catch (error) {
      console.error('Error parsing pending debate:', error);
      sessionStorage.removeItem('pendingDebate');
    }
  }, [isSignedIn, dailyDebate, router]);

  const startDebate = async () => {
    if (!userInput.trim() || !dailyDebate) return;
    
    if (!isSignedIn) {
      sessionStorage.setItem('pendingDebate', JSON.stringify({
        userInput,
        topic: dailyDebate.topic,
        persona: dailyDebate.persona,
        fromLandingPage: true
      }));
      openSignIn({ afterSignInUrl: '/' });
      return;
    }
    
    setIsStarting(true);
    const debateId = crypto.randomUUID();
    
    try {
      const response = await fetch('/api/debate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: 'custom',
          opponentStyle: dailyDebate.persona,
          topic: dailyDebate.topic,
          debateId
        })
      });
      
      if (response.ok) {
        sessionStorage.setItem('firstArgument', userInput);
        sessionStorage.setItem('isInstantDebate', 'true');
        router.push(`/debate/${debateId}`);
      } else {
        const error = await response.json();
        if (response.status === 429 && error.error === 'debate_limit_exceeded') {
          setShowUpgradeModal(true);
        } else {
          alert('Failed to start debate. Please try again.');
        }
        setIsStarting(false);
      }
    } catch (error) {
      console.error('Error starting debate:', error);
      alert('Failed to start debate. Please try again.');
      setIsStarting(false);
    }
  };

  const charCount = userInput.length;
  const maxChars = 2000;

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-4 relative z-10">
        <div className="w-full max-w-2xl">
          
          {/* Header Section - Compact */}
          <div className="text-center mb-6 animate-fade-up">
            {/* Label */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-[var(--accent)] opacity-50" />
              <span className="text-[10px] font-medium text-[var(--accent)] uppercase tracking-[0.2em]">
                Today&apos;s Debate
              </span>
              <span className="h-px w-6 bg-gradient-to-l from-transparent to-[var(--accent)] opacity-50" />
            </div>

            {/* Topic - Smaller */}
            <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[var(--text)] mb-3 leading-tight">
              {dailyDebate?.topic ? (
                <span className="gradient-text-animated">
                  {dailyDebate.topic}
                </span>
              ) : (
                <span className="inline-flex gap-2">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </span>
              )}
            </h1>
            
            {/* Opponent */}
            {dailyDebate && (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                <span>vs</span>
                <span className="text-[var(--text)] font-medium">{dailyDebate.persona}</span>
              </div>
            )}
          </div>

          {/* Input Card - Compact */}
          <div className="animate-fade-up delay-100 relative">
            {/* Subtle glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent-light)]/20 rounded-2xl blur-lg opacity-50" />
            
            <div 
              className={`
                relative artistic-card transition-all duration-300
                ${isFocused 
                  ? 'shadow-[0_0_40px_-10px_rgba(201,102,74,0.3)]' 
                  : ''
                }
              `}
            >
              <textarea
                value={userInput}
                onChange={(e) => {
                  if (e.target.value.length <= maxChars) {
                    setUserInput(e.target.value);
                  }
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    startDebate();
                  }
                }}
                placeholder="Share your perspective..."
                className="w-full px-5 py-4 bg-transparent resize-none outline-none text-[var(--text)] placeholder-[var(--text-tertiary)] min-h-[100px] text-[15px] leading-relaxed"
                autoFocus
              />
              
              {/* Input Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]/20">
                <span className={`text-[10px] font-mono transition-colors ${charCount > maxChars * 0.9 ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'}`}>
                  {charCount} / {maxChars}
                </span>
                
                <span className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-sunken)]/50 border border-[var(--border)]/30 text-[9px] font-mono">⌘</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-sunken)]/50 border border-[var(--border)]/30 text-[9px] font-mono">Enter</kbd>
                </span>
              </div>
            </div>

            {/* Action Buttons - Clean and visible */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={startDebate}
                disabled={!userInput.trim() || isStarting}
                className={`
                  flex-1 h-11 px-6 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2
                  ${userInput.trim() && !isStarting
                    ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30 hover:shadow-xl hover:shadow-[var(--accent)]/40 hover:-translate-y-0.5'
                    : 'bg-[var(--bg-sunken)] text-[var(--text-tertiary)] cursor-not-allowed'
                  }
                `}
              >
                {isStarting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <span>Start Debate</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                  </>
                )}
              </button>
              
              <Link
                href="/debate"
                className="h-11 px-5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-[var(--bg-elevated)]/50 border border-[var(--border)]/30 text-[var(--text)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border)]/50 transition-all duration-200"
                title="Custom debate setup"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="hidden sm:inline">Custom</span>
              </Link>
            </div>
          </div>

          {/* Upgrade Nudge - Compact */}
          {!isPremium && debatesUsed !== undefined && debatesUsed >= 2 && (
            <div className="mt-6 text-center animate-fade-in delay-200">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs text-[var(--accent)] bg-[var(--accent)]/5 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>
                  {debatesLimit && debatesUsed >= debatesLimit 
                    ? 'Limit reached — Upgrade'
                    : `${debatesLimit ? debatesLimit - debatesUsed : 0} left — Upgrade`
                  }
                </span>
              </button>
            </div>
          )}

          {/* Footer Links - Compact */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[var(--text-secondary)]">
            <Link href="/history" className="hover:text-[var(--text)] transition-colors">
              History
            </Link>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <Link href="/debate" className="hover:text-[var(--text)] transition-colors">
              Advanced Setup
            </Link>
          </div>
        </div>
      </main>

      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="button"
      />
    </div>
  );
}
