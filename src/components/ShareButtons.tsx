'use client';

import { useState } from 'react';
import { useToast } from './Toast';

interface ShareButtonsProps {
  debateId: string;
  topic: string;
  className?: string;
  onOpenModal?: () => void;
}

export default function ShareButtons({ debateId, topic, className = '', onOpenModal }: ShareButtonsProps) {
  const { showToast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const debateUrl = `${baseUrl}/debate/${debateId}`;
  
  const shareText = `I just debated "${topic}" on DebateAI — can you do better?`;
  
  const handleCopyLink = async () => {
    if (isCopying) return;
    
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(debateUrl);
      showToast('Link copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy link', 'error');
    } finally {
      setTimeout(() => setIsCopying(false), 500);
    }
  };
  
  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(debateUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };
  
  const showNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        disabled={isCopying}
        className={`
          inline-flex items-center justify-center w-8 h-8 rounded-lg 
          bg-[var(--bg-elevated)] border border-[var(--border)]/30 
          text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border)]/50 
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
          ${isCopying ? 'scale-95' : ''}
        `}
        aria-label={isCopying ? 'Link copied' : 'Copy debate link to clipboard'}
        aria-live="polite"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      
      {/* Twitter/X Share */}
      <button
        onClick={handleTwitterShare}
        className="
          inline-flex items-center justify-center w-8 h-8 rounded-lg 
          bg-[var(--bg-elevated)] border border-[var(--border)]/30 
          text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border)]/50 
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
        "
        aria-label="Share on X (Twitter)"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
      
      {/* More Options Button (opens modal) */}
      {onOpenModal && (
        <button
          onClick={onOpenModal}
          className="
            inline-flex items-center justify-center w-8 h-8 rounded-lg 
            bg-[var(--accent)]/10 border border-[var(--accent)]/20 
            text-[var(--accent)] hover:bg-[var(--accent)]/20 
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
          "
          aria-label="More sharing options"
          aria-haspopup="dialog"
          aria-expanded="false"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
      )}
    </div>
  );
}
