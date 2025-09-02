'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { opponents, getOpponentById } from '@/lib/opponents';
import Header from '@/components/Header';

// Memoized message component to prevent re-renders during streaming
const Message = memo(({ msg, opponent, isAILoading, isNew }: { 
  msg: { role: string; content: string; citations?: Array<{id: number; url: string; title: string}> }, 
  opponent: any,
  isAILoading: boolean,
  isNew?: boolean 
}) => {
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  
  // Parse content to add inline citation links
  const parseContentWithCitations = (content: string, citations: any[]) => {
    if (!citations || citations.length === 0) return content;
    
    // Replace [1], [2], etc. with clickable superscript links
    return content.replace(/\[(\d+)\]/g, (match, num) => {
      const citation = citations.find(c => c.id === parseInt(num));
      if (citation) {
        return `<sup><a href="#sources-msg" class="citation-inline" data-citation="${num}" title="${citation.title || 'View source'}">[${num}]</a></sup>`;
      }
      return match;
    });
  };
  
  const handleCitationClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('citation-inline')) {
      e.preventDefault();
      const citationNum = target.getAttribute('data-citation');
      const wasExpanded = isSourcesExpanded;
      setIsSourcesExpanded(true);
      
      // Wait for DOM update if we just expanded
      setTimeout(() => {
        const sourcesSection = document.getElementById('sources-msg');
        if (sourcesSection) {
          sourcesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          // Highlight the specific citation
          const citationElement = sourcesSection.querySelector(`[data-citation-id="${citationNum}"]`) as HTMLElement;
          if (citationElement) {
            citationElement.classList.add('citation-highlight');
            setTimeout(() => citationElement.classList.remove('citation-highlight'), 2000);
          }
        }
      }, wasExpanded ? 0 : 100); // Only delay if we just expanded
    }
  };
  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${isNew ? 'animate-slide-up' : ''}`}>
      <div className={`max-w-[70%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
        {msg.role === 'ai' && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{opponent?.avatar}</span>
            <span className="text-sm font-medium text-slate-400">{opponent?.name}</span>
          </div>
        )}
        {msg.role === 'user' && (
          <div className="text-right mb-1">
            <span className="text-sm font-medium text-slate-400">You</span>
          </div>
        )}
        <div className={`px-4 py-3 rounded-lg streaming-message ${
          msg.role === 'user' 
            ? 'message-user' 
            : 'message-ai'
        }`}>
          {msg.role === 'ai' && msg.content === '' && isAILoading ? (
            <div className="inline-flex gap-1">
              <span className="dot-bounce"></span>
              <span className="dot-bounce"></span>
              <span className="dot-bounce"></span>
            </div>
          ) : (
            <>
              <div className="text-slate-100 whitespace-pre-wrap" onClick={handleCitationClick}>
                <span dangerouslySetInnerHTML={{ 
                  __html: msg.citations ? parseContentWithCitations(msg.content || '', msg.citations) : (msg.content || '')
                }} />
                {msg.role === 'ai' && isAILoading && msg.content !== '' && (
                  <span className="typewriter-cursor" />
                )}
              </div>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-700" id="sources-msg">
                  <div 
                    className={`flex items-center justify-between cursor-pointer select-none ${isSourcesExpanded ? 'mb-2' : ''}`}
                    onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                  >
                    <div className="text-xs text-slate-500 font-medium">
                      📚 Sources ({msg.citations.length})
                    </div>
                    <svg 
                      className={`w-4 h-4 text-slate-500 transition-transform ${isSourcesExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1 transition-all duration-200 ease-out overflow-hidden ${
                    isSourcesExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    {msg.citations.map(citation => (
                      <a
                        key={citation.id}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="citation-link"
                        data-citation-id={citation.id}
                        title={citation.url}
                      >
                        <span className="citation-number">{citation.id}</span>
                        <span className="truncate">
                          {citation.title || new URL(citation.url).hostname}
                        </span>
                        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export default function DebatePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isSignedIn } = useUser();
  const debateId = params.debateId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if this is an instant debate from homepage
  const isInstant = searchParams.get('instant') === 'true';
  const firstArg = searchParams.get('firstArg') || '';
  
  const [debate, setDebate] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string; citations?: Array<{id: number; url: string; title: string}> }>>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDebate, setIsLoadingDebate] = useState(true);
  const [isAILoading, setIsAILoading] = useState(false);
  const [newMessageIndex, setNewMessageIndex] = useState<number | null>(null);
  const [currentCitations, setCurrentCitations] = useState<Array<{id: number; url: string; title: string}>>([]);

  // Track if we've already sent the first message
  const [hasAutoSent, setHasAutoSent] = useState(false);

  // Load debate data
  useEffect(() => {
    const loadDebate = async () => {
      try {
        const response = await fetch(`/api/debate/${debateId}`);
        if (response.ok) {
          const data = await response.json();
          setDebate(data.debate);
          setMessages(data.debate.messages || []);
        }
      } catch (error) {
        console.error('Failed to load debate:', error);
      } finally {
        setIsLoadingDebate(false);
      }
    };
    
    loadDebate();
  }, [debateId]);

  // Handle auto-sending first argument (separate effect to prevent double-sends)
  useEffect(() => {
    if (isInstant && firstArg && debate && !hasAutoSent && messages.length === 1) {
      setHasAutoSent(true);
      setTimeout(() => {
        sendMessage(firstArg);
      }, 500);
    }
  }, [isInstant, firstArg, debate, messages.length, hasAutoSent]);

  // Auto-scroll to bottom with debouncing during streaming
  useEffect(() => {
    // Only scroll if we're near the bottom (user hasn't scrolled up)
    const scrollContainer = messagesEndRef.current?.parentElement?.parentElement;
    if (scrollContainer) {
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
      
      if (isNearBottom && messagesEndRef.current) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ 
            behavior: 'auto', // Use 'auto' instead of 'smooth' to prevent conflicts
            block: 'end' 
          });
        });
      }
    }
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || userInput;
    if (!textToSend.trim() || isLoading) return;

    const newUserMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setIsAILoading(true);

    // Check if this is the first user turn
    const isFirstTurn = messages.filter(m => m.role === 'user').length === 0;

    try {
      // Use Anthropic API with WebSearch for better debates
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debateId,
          character: debate?.opponent || debate?.character || 'custom',
          opponentStyle: debate?.opponentStyle, // Pass custom style if available
          topic: debate?.topic,
          userArgument: textToSend,
          previousMessages: messages,
          stream: true
        })
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Add placeholder AI message
      const aiMessageIndex = messages.length + 1;
      setMessages(prev => [...prev, { role: 'ai', content: '' }]);

      let accumulatedContent = '';
      const charQueue: string[] = [];
      let isProcessing = false;
      const CHAR_DELAY = 10; // Reduced to 10ms for faster typing

      // Function to process character queue with typewriter effect
      const processCharQueue = () => {
        if (isProcessing || charQueue.length === 0) return;
        
        isProcessing = true;
        
        const processNextChar = () => {
          if (charQueue.length === 0) {
            isProcessing = false;
            return;
          }
          
          const char = charQueue.shift()!;
          accumulatedContent += char;
          
          requestAnimationFrame(() => {
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[aiMessageIndex] = { 
                role: 'ai', 
                content: accumulatedContent
              };
              return newMessages;
            });
          });
          
          if (charQueue.length > 0) {
            setTimeout(processNextChar, CHAR_DELAY);
          } else {
            isProcessing = false;
          }
        };
        
        processNextChar();
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Wait for all characters to be processed
          while (charQueue.length > 0 || isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'chunk') {
                // Clear loading state on first chunk
                if (isAILoading) {
                  setIsAILoading(false);
                }
                
                // Add characters to queue
                for (const char of data.content) {
                  charQueue.push(char);
                }
                
                // Start processing if not already running
                if (!isProcessing) {
                  processCharQueue();
                }
              } else if (data.type === 'search_start') {
                // Show search indicator
                const waitForQueue = () => {
                  if (charQueue.length > 0) {
                    setTimeout(waitForQueue, 50);
                  } else {
                    setMessages(prev => {
                      const newMessages = [...prev];
                      newMessages[aiMessageIndex] = { 
                        role: 'ai', 
                        content: accumulatedContent || '🔍 Searching the web...'
                      };
                      return newMessages;
                    });
                  }
                };
                waitForQueue();
              } else if (data.type === 'citations') {
                // Store citations to be added to the message
                setMessages(prev => {
                  const newMessages = [...prev];
                  const currentMessage = newMessages[aiMessageIndex];
                  newMessages[aiMessageIndex] = { 
                    ...currentMessage,
                    citations: data.citations
                  };
                  return newMessages;
                });
              } else if (data.type === 'complete') {
                // Final message - remove cursor and add citations
                const waitForCompletion = () => {
                  if (charQueue.length > 0 || isProcessing) {
                    setTimeout(waitForCompletion, 50);
                  } else {
                    setMessages(prev => {
                      const newMessages = [...prev];
                      newMessages[aiMessageIndex] = { 
                        role: 'ai', 
                        content: data.content || accumulatedContent,
                        citations: data.citations 
                      };
                      return newMessages;
                    });
                  }
                };
                waitForCompletion();
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Error: Could not generate response. Try again!' }]);
      setIsAILoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingDebate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-xl font-medium text-slate-100 mb-3">Preparing debate arena</div>
          <div className="inline-flex gap-1">
            <span className="dot-bounce"></span>
            <span className="dot-bounce"></span>
            <span className="dot-bounce"></span>
          </div>
        </div>
      </div>
    );
  }

  const opponent = debate ? getOpponentById(debate.opponent || debate.character) : null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden animate-fade-in">
      <Header />
      
      {/* Topic Display */}
      {debate && (
        <div className="border-b border-slate-700 bg-slate-800 px-4 py-3 animate-slide-down">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-3 text-sm">
              <div className="text-slate-100">
                <span className="text-slate-400 mr-2">Topic:</span>
                <span className="font-medium">{debate.topic}</span>
              </div>
              {(debate.opponentStyle || opponent) && (
                <>
                  <span className="text-slate-600">•</span>
                  <div className="text-slate-100">
                    <span className="text-slate-400 mr-2">Opponent:</span>
                    <span className="font-medium">{debate.opponentStyle || opponent?.name}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area - Scrollable Container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-4xl px-4 py-4">
          {/* Opponent Info */}
          {opponent && messages.length === 0 && (
            <div className="text-center mb-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
                <span className="text-2xl">{opponent.avatar}</span>
                <div className="text-left">
                  <div className="font-semibold text-slate-100">{opponent.name}</div>
                  <div className="text-xs text-slate-400">{opponent.style}</div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            {messages.filter(msg => msg && msg.role).map((msg, idx) => (
              <Message 
                key={idx} 
                msg={msg} 
                opponent={opponent}
                isAILoading={isAILoading && idx === messages.length - 1}
              />
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>

      {/* Input Area - Fixed */}
      <div className="border-t border-slate-700 bg-slate-900 flex-shrink-0">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your argument..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none text-slate-100 placeholder-slate-500"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !userInput.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isLoading || !userInput.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}