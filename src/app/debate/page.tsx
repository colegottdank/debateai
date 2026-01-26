'use client';

import { useState, useMemo } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UpgradeModal from '@/components/UpgradeModal';
import Header from '@/components/Header';
import { useSubscription } from '@/lib/useSubscription';
import { TOPIC_CATEGORIES, getTopicSuggestions, type Topic } from '@/lib/topics';
import { PERSONAS, PERSONA_CATEGORIES, type Persona, type PersonaCategory } from '@/lib/personas';
import { useTrending, type TrendingTopic } from '@/lib/useTrending';

type Tab = 'trending' | 'quick' | 'topics' | 'personas' | 'custom';

export default function DebatePage() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const { isPremium, debatesUsed, debatesLimit } = useSubscription();
  const { topics: trendingTopics, loading: trendingLoading } = useTrending();
  
  const [activeTab, setActiveTab] = useState<Tab>('trending');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedTopicCategory, setSelectedTopicCategory] = useState<string | null>(null);
  const [selectedPersonaCategory, setSelectedPersonaCategory] = useState<PersonaCategory | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [customPersona, setCustomPersona] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  
  const suggestions = useMemo(() => getTopicSuggestions(3), []);
  const randomPersonas = useMemo(() => {
    const shuffled = [...PERSONAS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);
  
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    trigger: 'rate-limit-debate' | 'rate-limit-message' | 'button';
    limitData?: { current: number; limit: number; };
  }>({ isOpen: false, trigger: 'button' });

  const currentTopic = selectedTopic?.question || customTopic;
  const currentPersona = selectedPersona?.name || customPersona;
  const currentPersonaId = selectedPersona?.id;
  const canStart = currentTopic.trim() && currentPersona.trim();

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
          topicId: selectedTopic?.id,
          debateId
        })
      });
      
      if (response.ok) {
        router.push(`/debate/${debateId}`);
      } else {
        const error = await response.json();
        if (response.status === 429 && error.error === 'debate_limit_exceeded') {
          setUpgradeModal({ isOpen: true, trigger: 'rate-limit-debate', limitData: { current: error.current, limit: error.limit } });
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

  const selectQuickStart = (topic: Topic, persona: Persona) => {
    setSelectedTopic(topic);
    setSelectedPersona(persona);
    setCustomTopic('');
    setCustomPersona('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <UpgradeModal isOpen={upgradeModal.isOpen} onClose={() => setUpgradeModal(prev => ({ ...prev, isOpen: false }))} trigger={upgradeModal.trigger} limitData={upgradeModal.limitData} />
      <Header />

      <main className="flex-1 px-4 py-8 max-w-6xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Choose Your Debate</h1>
          <p className="text-slate-400">Pick a topic and opponent, or create your own</p>
          
          {!isPremium && debatesUsed !== undefined && debatesLimit !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full text-xs">
              <span className="text-slate-400">Free debates:</span>
              <span className={`font-medium ${debatesUsed >= debatesLimit ? 'text-red-400' : 'text-green-400'}`}>
                {debatesLimit - debatesUsed} remaining
              </span>
              <button onClick={() => setUpgradeModal({ isOpen: true, trigger: 'button', limitData: { current: debatesUsed, limit: debatesLimit }})} className="text-indigo-400 hover:text-indigo-300 ml-2">Upgrade</button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {[
            { id: 'trending', label: '🔥 Trending Now' },
            { id: 'quick', label: '⚡ Quick Start' },
            { id: 'topics', label: '📚 Topics' },
            { id: 'personas', label: '🎭 Opponents' },
            { id: 'custom', label: '✏️ Custom' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'trending' && (
            <div className="space-y-6">
              <p className="text-center text-slate-400 text-sm">
                {trendingLoading ? 'Loading what the world is arguing about...' : 'Fresh debates from today\'s news'}
              </p>
              {trendingLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 animate-pulse">
                      <div className="h-4 bg-slate-700 rounded w-1/3 mb-3"></div>
                      <div className="h-5 bg-slate-700 rounded w-full mb-2"></div>
                      <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trendingTopics.map((topic) => (
                    <button key={topic.id} onClick={() => { 
                      setSelectedTopic({ id: topic.id, question: topic.question, spicyLevel: topic.heat }); 
                      setCustomTopic(''); 
                    }}
                      className={`p-4 rounded-xl border text-left transition-all ${selectedTopic?.id === topic.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          topic.category === 'politics' ? 'bg-red-500/20 text-red-400' :
                          topic.category === 'tech' ? 'bg-blue-500/20 text-blue-400' :
                          topic.category === 'culture' ? 'bg-purple-500/20 text-purple-400' :
                          topic.category === 'business' ? 'bg-green-500/20 text-green-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>{topic.category}</span>
                        <div className="flex">{[...Array(topic.heat)].map((_, i) => <span key={i} className="text-xs">🔥</span>)}</div>
                      </div>
                      <p className="text-slate-100 font-medium mb-2">{topic.question}</p>
                      <p className="text-xs text-slate-500">{topic.context}</p>
                    </button>
                  ))}
                </div>
              )}
              {!trendingLoading && trendingTopics.length === 0 && (
                <p className="text-center text-slate-500">No trending topics available. Try Quick Start!</p>
              )}
            </div>
          )}

          {activeTab === 'quick' && (
            <div className="space-y-6">
              <p className="text-center text-slate-400 text-sm">Click a combination to select it</p>
              <div className="grid gap-4 md:grid-cols-3">
                {suggestions.map((topic, i) => (
                  <button key={topic.id} onClick={() => selectQuickStart(topic, randomPersonas[i])}
                    className={`p-4 rounded-xl border text-left transition-all ${selectedTopic?.id === topic.id && selectedPersona?.id === randomPersonas[i].id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{randomPersonas[i].emoji}</span>
                      <span className="text-sm font-medium text-slate-300">{randomPersonas[i].name}</span>
                    </div>
                    <p className="text-slate-100 font-medium mb-1">{topic.question}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{randomPersonas[i].title}</span>
                      {topic.spicyLevel === 3 && <span className="text-xs">🔥</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-center gap-2">
                {TOPIC_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedTopicCategory(selectedTopicCategory === cat.id ? null : cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedTopicCategory === cat.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto p-1">
                {(selectedTopicCategory ? TOPIC_CATEGORIES.find(c => c.id === selectedTopicCategory)?.topics || [] : TOPIC_CATEGORIES.flatMap(c => c.topics).slice(0, 20)).map(topic => (
                  <button key={topic.id} onClick={() => { setSelectedTopic(topic); setCustomTopic(''); }}
                    className={`p-3 rounded-lg border text-left transition-all ${selectedTopic?.id === topic.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                    <p className="text-sm text-slate-100">{topic.question}</p>
                    <div className="flex items-center gap-1 mt-1">{[...Array(topic.spicyLevel)].map((_, i) => <span key={i} className="text-xs">🔥</span>)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'personas' && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-center gap-2">
                {PERSONA_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedPersonaCategory(selectedPersonaCategory === cat.id ? null : cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedPersonaCategory === cat.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto p-1">
                {(selectedPersonaCategory ? PERSONAS.filter(p => p.category === selectedPersonaCategory) : PERSONAS.slice(0, 18)).map(persona => (
                  <button key={persona.id} onClick={() => { setSelectedPersona(persona); setCustomPersona(''); }}
                    className={`p-4 rounded-lg border text-left transition-all ${selectedPersona?.id === persona.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{persona.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-100 font-medium truncate">{persona.name}</p>
                        <p className="text-xs text-slate-400 truncate">{persona.title}</p>
                      </div>
                      <div className="flex">{[...Array(persona.difficulty)].map((_, i) => <span key={i} className="text-xs">💀</span>)}</div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{persona.traits.join(' • ')}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Your Debate Topic</label>
                <textarea value={customTopic} onChange={(e) => { setCustomTopic(e.target.value); setSelectedTopic(null); }}
                  placeholder="What do you want to debate? (e.g., 'Is pineapple on pizza a crime?')"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none resize-none h-24 text-slate-100 placeholder-slate-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Your Opponent</label>
                <textarea value={customPersona} onChange={(e) => { setCustomPersona(e.target.value); setSelectedPersona(null); }}
                  placeholder="Who do you want to debate? (e.g., 'Elon Musk', 'a Socratic philosopher')"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none resize-none h-24 text-slate-100 placeholder-slate-500" />
              </div>
            </div>
          )}
        </div>

        {/* Selection Summary */}
        {(currentTopic || currentPersona) && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 max-w-2xl mx-auto">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Your Debate</p>
            <div className="space-y-2">
              {currentTopic && <div className="flex items-start gap-2"><span className="text-slate-500">📌</span><p className="text-slate-100">{currentTopic}</p></div>}
              {currentPersona && <div className="flex items-start gap-2"><span className="text-slate-500">{selectedPersona?.emoji || '🎭'}</span><p className="text-slate-300">vs. <span className="text-slate-100">{currentPersona}</span></p></div>}
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="max-w-md mx-auto">
          <button onClick={startDebate} disabled={!canStart || isStarting}
            className={`w-full py-4 px-6 font-medium rounded-xl transition-all text-lg ${canStart && !isStarting ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/25' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
            {isStarting ? 'Starting...' : canStart ? '⚔️ Start Debate' : 'Select topic & opponent'}
          </button>
          <p className="text-center text-slate-500 text-xs mt-3">Press ⌘+Enter to start</p>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6">
          <Link href="/" className="text-slate-500 hover:text-slate-100 text-sm transition-colors">← Daily Debate</Link>
          <span className="text-slate-600">•</span>
          <Link href="/history" className="text-slate-500 hover:text-slate-100 text-sm transition-colors">Previous Debates</Link>
        </div>
      </main>
    </div>
  );
}
