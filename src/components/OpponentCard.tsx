import React from 'react';
import { Opponent, OpponentType } from '@/lib/opponents';

interface OpponentCardProps {
  opponent: Opponent;
  isSelected?: boolean;
  onSelect?: (opponentId: OpponentType) => void;
}

const OpponentCard: React.FC<OpponentCardProps> = ({
  opponent,
  isSelected = false,
  onSelect
}) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(opponent.id);
    }
  };

  const content = (
    <>
      <div className="flex items-start gap-4">
        <div className="text-4xl">{opponent.avatar}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-lg text-gray-900 mb-1">{opponent.name}</h4>
          <div className="text-xs text-gray-500 mb-2 capitalize">Level: {opponent.level}</div>
          <p className="text-sm text-gray-600 mb-3">{opponent.description}</p>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">
              <span className="font-semibold">Style:</span> {opponent.style}
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-semibold">Strengths:</span> {opponent.strengths}
            </div>
          </div>
        </div>
      </div>
      {isSelected && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-900">
            <span className="text-sm font-semibold">✓ Selected</span>
          </div>
        </div>
      )}
    </>
  );

  if (onSelect) {
    return (
      <button
        onClick={handleClick}
        className={`w-full text-left bg-white rounded-lg p-6 border-2 transition-all ${
          isSelected 
            ? 'border-gray-900 shadow-md' 
            : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {content}
    </div>
  );
};

export default OpponentCard;