'use client';

import { useState } from 'react';

interface VoteButtonsProps {
  debateId: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  userVote?: 'up' | 'down' | null;
  onVote?: (type: 'up' | 'down' | null) => void;
  size?: 'sm' | 'md';
}

export default function VoteButtons({
  debateId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  userVote = null,
  onVote,
  size = 'md',
}: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [currentVote, setCurrentVote] = useState<'up' | 'down' | null>(userVote);
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async (type: 'up' | 'down') => {
    if (isLoading) return;

    setIsLoading(true);

    // Optimistic update
    const previousVote = currentVote;
    let newUpvotes = upvotes;
    let newDownvotes = downvotes;
    let newVote: 'up' | 'down' | null = type;

    if (currentVote === type) {
      // Remove vote
      newVote = null;
      if (type === 'up') newUpvotes--;
      else newDownvotes--;
    } else {
      // Add or change vote
      if (currentVote === 'up') newUpvotes--;
      if (currentVote === 'down') newDownvotes--;
      if (type === 'up') newUpvotes++;
      else newDownvotes++;
    }

    setCurrentVote(newVote);
    setUpvotes(newUpvotes);
    setDownvotes(newDownvotes);

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debateId, vote: newVote }),
      });
      
      if (!response.ok) {
        throw new Error('Vote failed');
      }
      
      onVote?.(newVote);
    } catch (error) {
      // Revert on error
      setCurrentVote(previousVote);
      setUpvotes(upvotes);
      setDownvotes(downvotes);
      console.error('Vote failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  const score = upvotes - downvotes;
  const scoreColor = score > 0 
    ? 'text-green-500' 
    : score < 0 
      ? 'text-red-500' 
      : 'text-[var(--text-secondary)]';

  return (
    <div className="flex items-center gap-1">
      {/* Upvote */}
      <button
        onClick={() => handleVote('up')}
        disabled={isLoading}
        className={`
          ${buttonSize} rounded-lg flex items-center justify-center transition-all duration-150
          ${currentVote === 'up'
            ? 'bg-green-500/10 text-green-500 border border-green-500/30'
            : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border)]/30 hover:text-green-500 hover:border-green-500/20'
          }
          disabled:opacity-50
        `}
        aria-label="Upvote"
      >
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Score */}
      <span className={`${textSize} font-medium min-w-[1.5rem] text-center tabular-nums ${scoreColor}`}>
        {score > 0 ? `+${score}` : score}
      </span>

      {/* Downvote */}
      <button
        onClick={() => handleVote('down')}
        disabled={isLoading}
        className={`
          ${buttonSize} rounded-lg flex items-center justify-center transition-all duration-150
          ${currentVote === 'down'
            ? 'bg-red-500/10 text-red-500 border border-red-500/30'
            : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border)]/30 hover:text-red-500 hover:border-red-500/20'
          }
          disabled:opacity-50
        `}
        aria-label="Downvote"
      >
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
