'use client';

import React, { useState, useEffect } from 'react';
import { SignedOut, SignInButton } from '@clerk/nextjs';
import { useUser } from '@/lib/useTestUser';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'rate-limit-debate' | 'rate-limit-message' | 'feature' | 'button';
  limitData?: { current: number; limit: number };
}

export default function UpgradeModal({ isOpen, onClose, trigger = 'button', limitData }: UpgradeModalProps) {
  const { user } = useUser();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.pathname + window.location.search }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.hasSubscription) {
        alert('You already have an active subscription!');
        onClose();
      } else {
        alert(data.error || 'Failed to start checkout. Please try again.');
        setIsUpgrading(false);
      }
    } catch (error) {
      alert('Connection error. Please check your internet and try again.');
      setIsUpgrading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const isMessageLimit = trigger === 'rate-limit-message';
  const isDebateLimit = trigger === 'rate-limit-debate';

  const features = [
    { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', title: 'Unlimited debates', desc: 'Create as many as you want' },
    { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', title: 'Unlimited messages', desc: 'No limits on length' },
    { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', title: 'Web search', desc: 'Real-time data & citations' },
    { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Full history', desc: 'Access all past debates' },
  ];

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div 
          className="w-full max-w-md bg-[var(--bg-elevated)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden animate-fade-scale"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/10 mb-3">
                  <svg className="w-3 h-3 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                  <span className="text-xs font-medium text-[var(--accent)]">Premium</span>
                </div>
                
                <h2 className="text-lg font-semibold text-[var(--text)]">
                  {isMessageLimit ? 'Message limit reached' : isDebateLimit ? 'Debate limit reached' : 'Upgrade to Premium'}
                </h2>
                <p className="text-small text-[var(--text-secondary)] mt-1">
                  {isMessageLimit 
                    ? `You have used ${limitData?.current || 2} of ${limitData?.limit || 2} free messages`
                    : isDebateLimit 
                    ? `You have created ${limitData?.current || 3} of ${limitData?.limit || 3} free debates`
                    : 'Unlock unlimited debates and messages'
                  }
                </p>
              </div>
              
              <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--bg-sunken)] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border-light)]">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon}/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--text)]">{f.title}</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/10 text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-[var(--text)]">$20</span>
                <span className="text-[var(--text-secondary)]">/month</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Cancel anytime</p>
            </div>

            <div className="space-y-2.5">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full btn btn-primary btn-lg">Sign in to upgrade</button>
                </SignInButton>
              </SignedOut>
              
              {user && (
                <>
                  <button onClick={handleUpgrade} disabled={isUpgrading} className={`w-full btn btn-lg ${isUpgrading ? 'opacity-50 cursor-not-allowed bg-[var(--bg-sunken)]' : 'btn-primary'}`}>
                    {isUpgrading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Loading...
                      </>
                    ) : 'Upgrade to Premium'}
                  </button>
                  
                  <button onClick={onClose} className="w-full btn btn-secondary">Maybe later</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
