'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UpgradeModal from '@/components/UpgradeModal';
import Header from '@/components/Header';
import { useSubscription } from '@/lib/useSubscription';
import { TOPIC_CATEGORIES, type Topic } from '@/lib/topics';
import { PERSONAS, PERSONA_CATEGORIES, type Persona, type PersonaCategory } from '@/lib/personas';
import { useTrending, type TrendingTopic } from '@/lib/useTrending';

type TopicMode = 'trending' | 'browse' | 'custom';
type PersonaMode = 'browse' | 'custom';

export default function DebatePage() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const { isPremium, debatesUsed, debatesLimit } = useSubscription();
  const { topics: trendingTopics, loading: trendingLoading } = useTrending();
  
  // Topic state
  const [topicMode, setTopicMode] = useState<TopicMode>('trending');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedTrendingTopic, setSelectedTrendingTopic] = useState<TrendingTopic | null>(null);
  const [selectedTopicCategory, setSelectedTopicCategory] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  
  // Persona state
  const [personaMode, setPersonaMode] = useState<PersonaMode>('browse');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedPersonaCategory, setSelectedPersonaCategory] = useState<PersonaCategory | null>(null);
  const [customPersona, setCustomPersona] = useState('');
  
  // UI state
  const [isStarting, setIsStarting] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    trigger: 'rate-limit-debate' | 'rate-limit-message' | 'button';
    limitData?: { current: number; limit: number };
  }>({ isOpen: false, trigger: 'button' });

  // Derived values
  const currentTopic = selectedTrendingTopic?.question || selectedTopic?.question || customTopic;
  const currentTopicId = selectedTrendingTopic?.id || selectedTopic?.id;
  const currentPersona = selectedPersona?.name || customPersona;
  const currentPersonaId = selectedPersona?.id;
  const canStart = currentTopic.trim() && currentPersona.trim();

  // Keyboard shortcut: ⌘+Enter or Ctrl+Enter to start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canStart && !isStarting) {
        e.preventDefault();
        startDebate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canStart, isStarting]);

  const startDebate = async () => {
    if (!canStart) return;
    if (!isSignedIn) { openSignIn(); return; }
    
    setIsStarting(true);
    const debateId = crypto.randomUUID();
    
    try {
      const response = await fetch('/api/debate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: 'custom',
          opponentStyle: currentPersona,
          opponentId: currentPersonaId,
          topic: currentTopic,
          topicId: currentTopicId,
          debateId
        })
      });
      
      if (response.ok) {
        router.push(`/debate/${debateId}`);
      } else {
        const error = await response.json();
        if (response.status === 429 && error.error === 'debate_limit_exceeded') {
          setUpgradeModal({ 
            isOpen: true, 
            trigger: 'rate-limit-debate', 
            limitData: { current: error.current, limit: error.limit } 
          });
        } else if (response.status === 401) {
          openSignIn();
        } else {
          alert('Failed to create debate. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating debate:', error);
      alert('Failed to create debate. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const selectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setSelectedTrendingTopic(null);
    setCustomTopic('');
  };

  const selectTrendingTopic = (topic: TrendingTopic) => {
    setSelectedTrendingTopic(topic);
    setSelectedTopic(null);
    setCustomTopic('');
  };

  const selectPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setCustomPersona('');
  };

  const handleCustomTopicChange = (value: string) => {
    setCustomTopic(value);
    setSelectedTopic(null);
    setSelectedTrendingTopic(null);
  };

  const handleCustomPersonaChange = (value: string) => {
    setCustomPersona(value);
    setSelectedPersona(null);
  };

  // Surprise Me - random topic + persona
  const surpriseMe = useCallback(() => {
    const allTopics = TOPIC_CATEGORIES.flatMap(c => c.topics);
    const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
    const randomPersona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
    setSelectedTopic(randomTopic);
    setSelectedTrendingTopic(null);
    setCustomTopic('');
    setSelectedPersona(randomPersona);
    setCustomPersona('');
    setTopicMode('browse');
    setPersonaMode('browse');
  }, []);

  const filteredTopics = selectedTopicCategory 
    ? TOPIC_CATEGORIES.find(c => c.id === selectedTopicCategory)?.topics || []
    : TOPIC_CATEGORIES.flatMap(c => c.topics).slice(0, 24);

  const filteredPersonas = selectedPersonaCategory
    ? PERSONAS.filter(p => p.category === selectedPersonaCategory)
    : PERSONAS.slice(0, 18);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <UpgradeModal 
        isOpen={upgradeModal.isOpen} 
        onClose={() => setUpgradeModal(prev => ({ ...prev, isOpen: false }))} 
        trigger={upgradeModal.trigger} 
        limitData={upgradeModal.limitData} 
      />
      <Header />

      <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">⚔️ Enter the Arena</h1>
          <p className="text-foreground-secondary">Choose your battlefield and opponent</p>
          
          {!isPremium && debatesUsed !== undefined && debatesLimit !== undefined && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-full text-xs">
              <span className="text-foreground-muted">Free debates:</span>
              <span className={`font-semibold ${debatesUsed >= debatesLimit ? 'text-red-500' : 'text-green-500'}`}>
                {debatesLimit - debatesUsed} left
              </span>
              <button 
                onClick={() => setUpgradeModal({ isOpen: true, trigger: 'button', limitData: { current: debatesUsed, limit: debatesLimit }})} 
                className="text-accent hover:text-accent-hover font-medium ml-1"
              >
                Upgrade
              </button>
            </div>
          )}
        </div>

        {/* Surprise Me Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={surpriseMe}
            className="px-4 py-2 bg-surface border border-border rounded-full text-sm font-medium hover:border-accent hover:text-accent transition-all flex items-center gap-2"
          >
            <span>🎲</span>
            <span>Surprise Me</span>
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* LEFT: Topic Selection */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-hover">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span>📌</span>
                <span>Choose Your Topic</span>
              </h2>
            </div>
            
            {/* Selected Topic Display */}
            {currentTopic && (
              <div className="p-4 bg-accent-bg border-b border-border">
                <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">Selected</p>
                <p className="font-medium text-foreground">{currentTopic}</p>
              </div>
            )}

            {/* Topic Mode Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: 'trending', label: '🔥 Trending' },
                { id: 'browse', label: '📚 Browse' },
                { id: 'custom', label: '✏️ Custom' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTopicMode(tab.id as TopicMode)}
                  className={`flex-1 px-3 py-2.5 text-sm font-medium transition-all ${
                    topicMode === tab.id 
                      ? 'text-accent border-b-2 border-accent bg-accent-bg/50' 
                      : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Topic Content */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {topicMode === 'trending' && (
                <div className="space-y-3">
                  {trendingLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="p-3 rounded-lg border border-border bg-surface animate-pulse">
                          <div className="h-4 bg-border rounded w-1/4 mb-2"></div>
                          <div className="h-5 bg-border rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : trendingTopics.length > 0 ? (
                    trendingTopics.map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => selectTrendingTopic(topic)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          selectedTrendingTopic?.id === topic.id
                            ? 'border-accent bg-accent-bg'
                            : 'border-border hover:border-accent/50 hover:bg-surface-hover'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            topic.category === 'politics' ? 'bg-red-500/10 text-red-500' :
                            topic.category === 'tech' ? 'bg-blue-500/10 text-blue-500' :
                            topic.category === 'culture' ? 'bg-purple-500/10 text-purple-500' :
                            topic.category === 'business' ? 'bg-green-500/10 text-green-500' :
                            'bg-border text-foreground-muted'
                          }`}>
                            {topic.category}
                          </span>
                          <span className="text-xs">{'🔥'.repeat(topic.heat)}</span>
                        </div>
                        <p className="font-medium text-foreground">{topic.question}</p>
                        <p className="text-xs text-foreground-muted mt-1">{topic.context}</p>
                      </button>
                    ))
                  ) : (
                    <p className="text-foreground-muted text-center py-8">No trending topics. Try Browse!</p>
                  )}
                </div>
              )}

              {topicMode === 'browse' && (
                <div className="space-y-4">
                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTopicCategory(null)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        !selectedTopicCategory 
                          ? 'bg-accent text-white' 
                          : 'bg-surface-hover text-foreground-muted hover:text-foreground'
                      }`}
                    >
                      All
                    </button>
                    {TOPIC_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedTopicCategory(selectedTopicCategory === cat.id ? null : cat.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          selectedTopicCategory === cat.id 
                            ? 'bg-accent text-white' 
                            : 'bg-surface-hover text-foreground-muted hover:text-foreground'
                        }`}
                      >
                        {cat.emoji} {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Topic List */}
                  <div className="grid gap-2">
                    {filteredTopics.map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => selectTopic(topic)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedTopic?.id === topic.id
                            ? 'border-accent bg-accent-bg'
                            : 'border-border hover:border-accent/50 hover:bg-surface-hover'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground text-sm">{topic.question}</p>
                          <span className="text-xs ml-2 flex-shrink-0">{'🔥'.repeat(topic.spicyLevel)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {topicMode === 'custom' && (
                <div>
                  <textarea
                    value={customTopic}
                    onChange={(e) => handleCustomTopicChange(e.target.value)}
                    placeholder="What do you want to debate?&#10;&#10;e.g., 'Is pineapple on pizza a crime against humanity?'"
                    className="w-full p-3 bg-input-bg border border-border rounded-lg focus:border-accent focus:outline-none resize-none h-32 text-foreground placeholder-foreground-muted"
                  />
                  <p className="text-xs text-foreground-muted mt-2">
                    💡 The weirder the better. AI opponents handle anything.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Opponent Selection */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-hover">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span>🎭</span>
                <span>Choose Your Opponent</span>
              </h2>
            </div>

            {/* Selected Persona Display */}
            {currentPersona && (
              <div className="p-4 bg-accent-bg border-b border-border">
                <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">Selected</p>
                <div className="flex items-center gap-3">
                  {selectedPersona && <span className="text-2xl">{selectedPersona.emoji}</span>}
                  <div>
                    <p className="font-medium text-foreground">{currentPersona}</p>
                    {selectedPersona && (
                      <p className="text-xs text-foreground-muted">{selectedPersona.title}</p>
                    )}
                  </div>
                  {selectedPersona && (
                    <span className="ml-auto text-xs">{'💀'.repeat(selectedPersona.difficulty)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Persona Mode Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: 'browse', label: '🎭 Browse' },
                { id: 'custom', label: '✏️ Custom' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPersonaMode(tab.id as PersonaMode)}
                  className={`flex-1 px-3 py-2.5 text-sm font-medium transition-all ${
                    personaMode === tab.id 
                      ? 'text-accent border-b-2 border-accent bg-accent-bg/50' 
                      : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Persona Content */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {personaMode === 'browse' && (
                <div className="space-y-4">
                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedPersonaCategory(null)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        !selectedPersonaCategory 
                          ? 'bg-accent text-white' 
                          : 'bg-surface-hover text-foreground-muted hover:text-foreground'
                      }`}
                    >
                      All
                    </button>
                    {PERSONA_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedPersonaCategory(selectedPersonaCategory === cat.id ? null : cat.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          selectedPersonaCategory === cat.id 
                            ? 'bg-accent text-white' 
                            : 'bg-surface-hover text-foreground-muted hover:text-foreground'
                        }`}
                      >
                        {cat.emoji} {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Persona Grid */}
                  <div className="grid gap-2">
                    {filteredPersonas.map(persona => (
                      <button
                        key={persona.id}
                        onClick={() => selectPersona(persona)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedPersona?.id === persona.id
                            ? 'border-accent bg-accent-bg'
                            : 'border-border hover:border-accent/50 hover:bg-surface-hover'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{persona.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{persona.name}</p>
                              <span className="text-xs">{'💀'.repeat(persona.difficulty)}</span>
                            </div>
                            <p className="text-xs text-foreground-muted">{persona.title}</p>
                          </div>
                        </div>
                        <p className="text-xs text-foreground-muted mt-2 line-clamp-1">
                          {persona.traits.join(' · ')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {personaMode === 'custom' && (
                <div>
                  <textarea
                    value={customPersona}
                    onChange={(e) => handleCustomPersonaChange(e.target.value)}
                    placeholder="Who should argue against you?&#10;&#10;e.g., 'A conspiracy theorist who thinks birds aren't real'"
                    className="w-full p-3 bg-input-bg border border-border rounded-lg focus:border-accent focus:outline-none resize-none h-32 text-foreground placeholder-foreground-muted"
                  />
                  <p className="text-xs text-foreground-muted mt-2">
                    💡 Real people, fictional characters, archetypes — go wild.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Start Debate CTA */}
        <div className="max-w-2xl mx-auto">
          {canStart ? (
            <div className="bg-surface border-2 border-accent rounded-xl p-6 text-center">
              <p className="text-foreground-muted text-sm mb-3">Ready to debate</p>
              <p className="text-xl md:text-2xl font-bold mb-2 text-foreground">"{currentTopic}"</p>
              <p className="text-foreground-secondary mb-4">
                vs. <span className="font-semibold text-accent">{currentPersona}</span>
                {selectedPersona && <span className="ml-1">{selectedPersona.emoji}</span>}
              </p>
              <button
                onClick={startDebate}
                disabled={isStarting}
                className="w-full py-4 px-6 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-all text-lg shadow-lg shadow-accent/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStarting ? 'Entering Arena...' : '⚔️ Start Debate'}
              </button>
              <p className="text-xs text-foreground-muted mt-3">
                Press <kbd className="px-1.5 py-0.5 bg-surface-hover rounded text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-surface-hover rounded text-xs">Enter</kbd> to start
              </p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-6 text-center">
              <p className="text-foreground-muted">
                {!currentTopic && !currentPersona && 'Select a topic and opponent to begin'}
                {currentTopic && !currentPersona && '✓ Topic selected — now pick an opponent'}
                {!currentTopic && currentPersona && '✓ Opponent selected — now pick a topic'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <Link href="/" className="text-foreground-muted hover:text-foreground text-sm transition-colors">
            ← Daily Debate
          </Link>
          <span className="text-border">•</span>
          <Link href="/history" className="text-foreground-muted hover:text-foreground text-sm transition-colors">
            Previous Debates
          </Link>
        </div>
      </main>
    </div>
  );
}
