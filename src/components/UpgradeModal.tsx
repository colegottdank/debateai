'use client';

import React, { useState, useEffect } from 'react';
import { SignedOut, SignInButton } from '@clerk/nextjs';
import { useUser } from '@/lib/useTestUser';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'rate-limit-debate' | 'rate-limit-message' | 'feature' | 'button';
  limitData?: {
    current: number;
    limit: number;
  };
}

export default function UpgradeModal({ 
  isOpen, 
  onClose,
  trigger = 'button',
  limitData
}: UpgradeModalProps) {
  const { user } = useUser();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.pathname + window.location.search
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.hasSubscription) {
        alert('You already have an active subscription!');
        onClose();
      } else {
        console.error('Checkout error:', data);
        alert(data.error || 'Failed to start checkout. Please try again.');
        setIsUpgrading(false);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Connection error. Please check your internet and try again.');
      setIsUpgrading(false);
    }
  };

  if (!isOpen) return null;

  const isMessageLimit = trigger === 'rate-limit-message';
  const isDebateLimit = trigger === 'rate-limit-debate';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                {isMessageLimit ? 'Message limit reached' : isDebateLimit ? 'Debate limit reached' : 'Upgrade to Premium'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {isMessageLimit 
                  ? `You've used ${limitData?.current || 2} of ${limitData?.limit || 2} free messages in this debate`
                  : isDebateLimit 
                  ? `You've created ${limitData?.current || 3} of ${limitData?.limit || 3} free debates`
                  : 'Unlock unlimited debates and messages'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Features */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Premium includes:</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm text-slate-200 font-medium">Unlimited debates</p>
                  <p className="text-xs text-slate-400">Create as many debates as you want</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm text-slate-200 font-medium">Unlimited messages</p>
                  <p className="text-xs text-slate-400">No limits on debate length</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm text-slate-200 font-medium">Web search & citations</p>
                  <p className="text-xs text-slate-400">AI opponents use real-time web data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm text-slate-200 font-medium">Debate history</p>
                  <p className="text-xs text-slate-400">Access and review all past debates</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-semibold text-slate-100">$20</span>
              <span className="text-sm text-slate-400">/ month</span>
            </div>
            <p className="text-xs text-slate-500 text-center mt-2">Cancel anytime</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-indigo-600 transition-colors">
                  Sign in to upgrade
                </button>
              </SignInButton>
            </SignedOut>
            
            {user && (
              <>
                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className={`w-full bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors ${
                    isUpgrading 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-indigo-600'
                  }`}
                >
                  {isUpgrading ? 'Loading...' : 'Upgrade to Premium'}
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full bg-slate-800 text-slate-300 font-medium py-2.5 px-4 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Maybe later
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}