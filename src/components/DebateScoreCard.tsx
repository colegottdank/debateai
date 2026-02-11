"use client";

import { useState } from "react";
import type { DebateScore } from "@/lib/scoring";
import ShareImageModal from "./ShareImageModal";

interface DebateScoreCardProps {
  debateId: string;
  score?: DebateScore | null;
  onScoreGenerated?: (score: DebateScore) => void;
  opponentName?: string;
  messageCount: number; // total user messages — need >= 2 to score
  messages?: Array<{ role: string; content: string }>;
  topic?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  logic: "Logic",
  evidence: "Evidence",
  persuasion: "Persuasion",
  clarity: "Clarity",
  rebuttal: "Rebuttal",
};

function ScoreBar({ label, userVal, aiVal }: { label: string; userVal: number; aiVal: number }) {
  const userPct = (userVal / 10) * 100;
  const aiPct = (aiVal / 10) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--accent)] font-medium w-6 text-right">{userVal}</span>
        <span className="text-[var(--text-secondary)] flex-1 text-center">{label}</span>
        <span className="text-orange-400 font-medium w-6">{aiVal}</span>
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 bg-[var(--bg-sunken)] rounded-full overflow-hidden flex justify-end">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-700"
            style={{ width: `${userPct}%` }}
          />
        </div>
        <div className="flex-1 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-400 rounded-full transition-all duration-700"
            style={{ width: `${aiPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function DebateScoreCard({
  debateId,
  score: initialScore,
  onScoreGenerated,
  opponentName = "AI",
  messageCount,
  messages = [],
  topic = "",
}: DebateScoreCardProps) {
  const [score, setScore] = useState<DebateScore | null>(initialScore || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareImageModal, setShowShareImageModal] = useState(false);

  const canScore = messageCount >= 2;

  const handleScore = async () => {
    if (!canScore || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/debate/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debateId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to score debate");
        return;
      }

      const data = await res.json();
      setScore(data.score);
      onScoreGenerated?.(data.score);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // No score yet — show the "Score This Debate" button
  if (!score) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5 text-center">
          <div className="text-3xl mb-2">⚖️</div>
          <h3 className="text-base font-semibold text-[var(--text)] mb-1">
            Ready to see who won?
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            {canScore
              ? "Get an AI judge to score this debate on logic, evidence, and persuasion."
              : "Keep debating! Need at least 2 exchanges to score."}
          </p>
          {error && (
            <p className="text-xs text-red-400 mb-3">{error}</p>
          )}
          <button
            onClick={handleScore}
            disabled={!canScore || loading}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all
              ${canScore && !loading
                ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] cursor-pointer"
                : "bg-[var(--bg-sunken)] text-[var(--text-tertiary)] cursor-not-allowed"
              }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Judging...
              </span>
            ) : (
              "⚖️ Score This Debate"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Score exists — show the full score card
  const winnerEmoji = score.winner === "user" ? "🏆" : score.winner === "ai" ? "😤" : "🤝";
  const winnerText =
    score.winner === "user"
      ? "You won!"
      : score.winner === "ai"
        ? `${opponentName} wins`
        : "It's a draw!";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 text-center border-b border-[var(--border)]/50">
          <div className="text-4xl mb-2">{winnerEmoji}</div>
          <h3 className="text-lg font-bold text-[var(--text)]">{winnerText}</h3>

          {/* Overall Scores */}
          <div className="flex items-center justify-center gap-8 mt-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--accent)]">{score.userScore}</div>
              <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">You</div>
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">vs</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{score.aiScore}</div>
              <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{opponentName}</div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            <span className="text-[var(--accent)]">You</span>
            <span>Category</span>
            <span className="text-orange-400">{opponentName}</span>
          </div>
          {Object.entries(score.categories).map(([key, val]) => (
            <ScoreBar
              key={key}
              label={CATEGORY_LABELS[key] || key}
              userVal={val.user}
              aiVal={val.ai}
            />
          ))}
        </div>

        {/* Summary & Highlights */}
        <div className="px-5 pb-5 space-y-3 border-t border-[var(--border)]/50 pt-4">
          <p className="text-sm text-[var(--text)] leading-relaxed">{score.summary}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-[var(--bg-sunken)] rounded-lg p-3">
              <div className="text-[10px] text-[var(--accent)] uppercase tracking-wider mb-1 font-medium">Your Strength</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{score.userStrength}</p>
            </div>
            <div className="bg-[var(--bg-sunken)] rounded-lg p-3">
              <div className="text-[10px] text-orange-400 uppercase tracking-wider mb-1 font-medium">{opponentName}&apos;s Strength</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{score.aiStrength}</p>
            </div>
          </div>

          <div className="bg-[var(--bg-sunken)] rounded-lg p-3">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 font-medium">💥 Key Moment</div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{score.keyMoment}</p>
          </div>

          {/* Share as Image Button */}
          <button
            onClick={() => setShowShareImageModal(true)}
            className="
              w-full mt-4 px-4 py-3 rounded-xl font-medium text-sm
              bg-gradient-to-r from-orange-500 to-red-500 text-white
              hover:from-orange-600 hover:to-red-600 hover:scale-[1.02] hover:shadow-lg
              active:scale-[0.98]
              transition-all duration-150 ease-out
              flex items-center justify-center gap-2
              focus:outline-none focus:ring-2 focus:ring-orange-500/50
            "
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Share as Image
          </button>
        </div>
      </div>

      {/* Share Image Modal */}
      {showShareImageModal && (
        <ShareImageModal
          isOpen={showShareImageModal}
          onClose={() => setShowShareImageModal(false)}
          debateId={debateId}
          topic={topic}
          opponentName={opponentName}
          messages={messages}
          score={score ? { winner: score.winner, userScore: score.userScore, aiScore: score.aiScore } : null}
        />
      )}
    </div>
  );
}
