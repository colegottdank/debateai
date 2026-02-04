'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  debateId: string;
  topic: string;
  className?: string;
}

export default function ShareButtons({ debateId, topic, className = '' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const debateUrl = `${baseUrl}/debate/${debateId}`;
  
  const shareText = `I just debated "${topic}" on DebateAI — can you do better?`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(debateUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(debateUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DebateAI',
          text: shareText,
          url: debateUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    }
  };
  
  const showNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]/30 text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border)]/50 transition-all text-xs font-medium"
        title="Copy link to clipboard"
      >
        {copied ? (
          <>
            <svg className="w-3.5 h-3.5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
            <span className="text-[var(--success)]">Copied!</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <span>Copy Link</span>
          </>
        )}
      </button>
      
      {/* Twitter/X Share */}
      <button
        onClick={handleTwitterShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]/30 text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border)]/50 transition-all text-xs font-medium"
        title="Share on Twitter/X"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <span className="hidden sm:inline">Share on X</span>
      </button>
      
      {/* Native Share (Mobile) */}
      {showNativeShare && (
        <button
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all text-xs font-medium sm:hidden"
          title="Share"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
          </svg>
          <span>Share</span>
        </button>
      )}
    </div>
  );
}
