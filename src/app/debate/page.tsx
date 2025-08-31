'use client';

import { useState } from 'react';
import { useUser } from '@/lib/useTestUser';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { OpponentType } from '@/lib/opponents';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { opponents } from '@/lib/opponents';
import AvatarUpload from '@/components/AvatarUpload';
import OpponentCard from '@/components/OpponentCard';
import TopicSelector from '@/components/TopicSelector';
import UpgradeModal from '@/components/UpgradeModal';

export default function DebatePage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentType | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  
  // Upgrade modal state
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    trigger: 'rate-limit-debate' | 'rate-limit-message' | 'button';
    limitData?: {
      current: number;
      limit: number;
    };
  }>({
    isOpen: false,
    trigger: 'button'
  });

  const startDebate = async () => {
    const topic = customTopic || selectedTopic;
    if (!selectedOpponent || !topic) {
      alert('Please select an opponent and topic!');
      return;
    }
    
    // Generate a unique debate ID
    const debateId = crypto.randomUUID();
    
    try {
      // Create debate in database first
      const response = await fetch('/api/debate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: selectedOpponent,
          topic,
          debateId
        })
      });
      
      if (response.ok) {
        // Navigate directly without query params!
        router.push(`/debate/${debateId}`);
      } else {
        const error = await response.json();
        console.error('Failed to create debate:', error);
        
        // Handle rate limit error
        if (response.status === 429 && error.error === 'debate_limit_exceeded') {
          setUpgradeModal({
            isOpen: true,
            trigger: 'rate-limit-debate',
            limitData: {
              current: error.current,
              limit: error.limit
            }
          });
        } else {
          alert('Failed to create debate. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating debate:', error);
      alert('Failed to create debate. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal(prev => ({ ...prev, isOpen: false }))}
        trigger={upgradeModal.trigger}
        limitData={upgradeModal.limitData}
      />
      
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              DebateAI
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/history" className="text-gray-600 hover:text-gray-900 transition-colors">
                My Debates
              </Link>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Advanced Debate Setup</h1>
            <p className="text-gray-600">Choose a specific opponent and topic</p>
          </div>

          {/* User Avatar Section */}
          <div className="mb-8">
            <AvatarUpload />
          </div>

          {/* Opponent Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Choose Your Opponent</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opponents.map((opponent) => (
                <OpponentCard
                  key={opponent.id}
                  opponent={opponent}
                  isSelected={selectedOpponent === opponent.id}
                  onSelect={setSelectedOpponent}
                />
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Select Your Topic</h2>
            <TopicSelector
              selectedTopic={selectedTopic}
              customTopic={customTopic}
              onTopicSelect={setSelectedTopic}
              onCustomTopicChange={setCustomTopic}
            />
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={startDebate}
              disabled={!selectedOpponent || (!selectedTopic && !customTopic)}
              className={`text-lg font-semibold py-4 px-12 rounded-lg transition-all ${
                selectedOpponent && (selectedTopic || customTopic)
                  ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {selectedOpponent && (selectedTopic || customTopic) 
                ? 'Begin Debate' 
                : 'Select an Opponent and Topic'}
            </button>
            
            {selectedOpponent && (selectedTopic || customTopic) && (
              <p className="mt-4 text-gray-600 text-sm">
                Ready to debate with {opponents.find(o => o.id === selectedOpponent)?.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}