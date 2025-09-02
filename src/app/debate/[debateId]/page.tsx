'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { opponents, getOpponentById } from '@/lib/opponents';
import Header from '@/components/Header';

// Memoized message component to prevent re-renders during streaming
const Message = memo(({ msg, opponent, debate, isAILoading, isUserLoading, isNew, msgIndex }: { 
  msg: { role: string; content: string; aiAssisted?: boolean; citations?: Array<{id: number; url: string; title: string}>; isSearching?: boolean }, 
  opponent: any,
  debate: any,
  isAILoading: boolean,
  isUserLoading?: boolean,
  isNew?: boolean,
  msgIndex: number 
}) => {
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  
  // Parse content to add inline citation links
  const parseContentWithCitations = (content: string, citations: any[]) => {
    if (!citations || citations.length === 0) return content;
    
    // Replace [1], [2], etc. with clickable superscript links
    return content.replace(/\[(\d+)\]/g, (match, num) => {
      const citation = citations.find(c => c.id === parseInt(num));
      if (citation) {
        return `<sup><a href="#sources-msg-${msgIndex}" class="citation-inline" data-citation="${num}" title="${citation.title || 'View source'}">[${num}]</a></sup>`;
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
        const sourcesSection = document.getElementById(`sources-msg-${msgIndex}`);
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
            <span className="text-sm">{opponent?.avatar || '🤖'}</span>
            <span className="text-sm font-medium text-slate-400">
              {debate?.opponentStyle || opponent?.name || 'AI Opponent'}
            </span>
          </div>
        )}
        {msg.role === 'user' && (
          <div className="text-right mb-1">
            <span className="text-sm font-medium text-slate-400">
              You
              {msg.aiAssisted && (
                <span className="ml-2 text-xs text-indigo-400">🤖 AI-assisted</span>
              )}
            </span>
          </div>
        )}
        <div className={`px-4 py-3 rounded-lg streaming-message ${
          msg.role === 'user' 
            ? msg.aiAssisted ? 'message-user border-dashed' : 'message-user'
            : 'message-ai'
        }`}>
          {(msg.role === 'ai' && msg.content === '' && isAILoading) || (msg.role === 'user' && msg.content === '' && isUserLoading) ? (
            <div className="inline-flex gap-1">
              <span className="dot-bounce"></span>
              <span className="dot-bounce"></span>
              <span className="dot-bounce"></span>
            </div>
          ) : (
            <>
              <div className="text-slate-100 whitespace-pre-wrap" onClick={handleCitationClick}>
                {msg.isSearching ? (
                  <>
                    <span>{msg.content}</span>
                    <span className="inline-flex gap-1 ml-1">
                      <span className="dot-bounce"></span>
                      <span className="dot-bounce"></span>
                      <span className="dot-bounce"></span>
                    </span>
                  </>
                ) : (
                  <>
                    <span dangerouslySetInnerHTML={{ 
                      __html: msg.citations ? parseContentWithCitations(msg.content || '', msg.citations) : (msg.content || '')
                    }} />
                    {((msg.role === 'ai' && isAILoading) || (msg.role === 'user' && isUserLoading)) && msg.content !== '' && msg.content !== '🔍 Searching the web' && (
                      <span className="typewriter-cursor" />
                    )}
                  </>
                )}
              </div>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-700" id={`sources-msg-${msgIndex}`}>
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Check if this is an instant debate from homepage (using sessionStorage)
  const [isInstant, setIsInstant] = useState(false);
  const [firstArg, setFirstArg] = useState('');
  
  const [debate, setDebate] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string; aiAssisted?: boolean; citations?: Array<{id: number; url: string; title: string}>; isSearching?: boolean }>>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDebate, setIsLoadingDebate] = useState(true);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [newMessageIndex, setNewMessageIndex] = useState<number | null>(null);
  const [currentCitations, setCurrentCitations] = useState<Array<{id: number; url: string; title: string}>>([]);
  const [isAITakeover, setIsAITakeover] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  // Track if we've already sent the first message
  const [hasAutoSent, setHasAutoSent] = useState(false);

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (isSignedIn === false) {
      router.push('/');
    }
  }, [isSignedIn, router]);

  // Check sessionStorage for instant debate data
  useEffect(() => {
    // Only check sessionStorage on client side
    const instantDebate = sessionStorage.getItem('isInstantDebate') === 'true';
    const firstArgument = sessionStorage.getItem('firstArgument') || '';
    
    if (instantDebate) {
      setIsInstant(true);
      setFirstArg(firstArgument);
      // Clear sessionStorage to prevent reuse
      sessionStorage.removeItem('isInstantDebate');
      sessionStorage.removeItem('firstArgument');
    }
  }, []);

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
    // Only auto-scroll if enabled
    if (isAutoScrollEnabled && messagesEndRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'auto', // Use 'auto' instead of 'smooth' to prevent conflicts
          block: 'end' 
        });
      });
    }
  }, [messages, isAutoScrollEnabled]);

  // Handle scroll detection to enable/disable auto-scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollContainer = e.currentTarget;
    const scrollBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
    
    // If user scrolled up more than 100px from bottom, disable auto-scroll
    if (scrollBottom > 100 && isAutoScrollEnabled) {
      setIsAutoScrollEnabled(false);
    }
    // If user scrolled back to within 50px of bottom, re-enable auto-scroll
    else if (scrollBottom < 50 && !isAutoScrollEnabled) {
      setIsAutoScrollEnabled(true);
    }
  }, [isAutoScrollEnabled]);

  const sendMessage = async (messageText?: string, isAIAssisted: boolean = false) => {
    const textToSend = messageText || userInput;
    if (!textToSend.trim() || isLoading) return;

    const newUserMessage: any = { role: 'user', content: textToSend };
    if (isAIAssisted) {
      newUserMessage.aiAssisted = true;
    }
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
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
                
                // Clear search indicator if showing
                if (accumulatedContent === '') {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages[aiMessageIndex]?.isSearching) {
                      newMessages[aiMessageIndex] = { 
                        ...newMessages[aiMessageIndex],
                        content: '',
                        isSearching: false
                      };
                    }
                    return newMessages;
                  });
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
                        ...newMessages[aiMessageIndex],
                        role: 'ai', 
                        content: accumulatedContent || '🔍 Searching the web',
                        isSearching: !accumulatedContent  // Only show dots if no content yet
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

  // AI Takeover - Let AI argue on user's behalf
  const handleAITakeover = async () => {
    if (isLoading || isAITakeover) return;
    
    setIsAITakeover(true);
    setIsLoading(true);
    setIsUserLoading(true);

    try {
      const response = await fetch('/api/debate/takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debateId,
          topic: debate?.topic,
          previousMessages: messages,
          opponentStyle: debate?.opponentStyle,
        })
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Add the user message immediately with empty content
      const userMessageIndex = messages.length;
      setMessages(prev => [...prev, { role: 'user', content: '', aiAssisted: true }]);
      
      let accumulatedAiArgument = '';
      const charQueue: string[] = [];
      let isProcessing = false;
      const CHAR_DELAY = 10; // Same delay as opponent responses
      
      const processCharQueue = async () => {
        if (isProcessing || charQueue.length === 0) return;
        isProcessing = true;
        
        while (charQueue.length > 0) {
          const chars = charQueue.splice(0, 3); // Process 3 chars at a time
          const charBatch = chars.join('');
          accumulatedAiArgument += charBatch;
          
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[userMessageIndex] = { 
              ...newMessages[userMessageIndex],
              role: 'user', 
              content: accumulatedAiArgument,
              aiAssisted: true
            };
            return newMessages;
          });
          
          if (charQueue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, CHAR_DELAY));
          }
        }
        
        isProcessing = false;
        if (charQueue.length > 0) {
          processCharQueue();
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Wait for all characters to be processed
              while (charQueue.length > 0 || isProcessing) {
                await new Promise(resolve => setTimeout(resolve, 50));
              }
              
              // Turn off user loading once streaming is complete
              setIsUserLoading(false);
              
              // AI takeover complete, now trigger opponent response
              if (accumulatedAiArgument.trim()) {
                setUserInput('');
                
                // Now trigger the opponent's response
                setIsLoading(true);
                setIsAILoading(true);
                
                // Use the regular debate API for opponent response
                const opponentResponse = await fetch('/api/debate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    debateId,
                    character: debate?.opponent || debate?.character || 'custom',
                    opponentStyle: debate?.opponentStyle,
                    topic: debate?.topic,
                    userArgument: accumulatedAiArgument,
                    previousMessages: messages,
                    isAIAssisted: true,  // Mark this as AI-assisted since it was generated by takeover
                    stream: true
                  })
                });

                // Process opponent response with existing logic
                if (!opponentResponse.body) {
                  throw new Error('No response body');
                }

                const opponentReader = opponentResponse.body.getReader();
                const opponentDecoder = new TextDecoder();
                
                const aiMessageIndex = messages.length + 1;
                setMessages(prev => [...prev, { role: 'ai', content: '' }]);

                let accumulatedContent = '';
                const charQueue: string[] = [];
                let isProcessing = false;
                const CHAR_DELAY = 10;

                const processCharQueue = async () => {
                  if (isProcessing || charQueue.length === 0) return;
                  isProcessing = true;
                  
                  while (charQueue.length > 0) {
                    const chars = charQueue.splice(0, 3);
                    const charBatch = chars.join('');
                    accumulatedContent += charBatch;
                    
                    setMessages(prev => {
                      const newMessages = [...prev];
                      newMessages[aiMessageIndex] = { 
                        ...newMessages[aiMessageIndex],
                        role: 'ai', 
                        content: accumulatedContent 
                      };
                      return newMessages;
                    });
                    
                    if (charQueue.length > 0) {
                      await new Promise(resolve => setTimeout(resolve, CHAR_DELAY));
                    }
                  }
                  
                  isProcessing = false;
                  if (charQueue.length > 0) {
                    processCharQueue();
                  }
                };

                const waitForCompletion = async () => {
                  while (charQueue.length > 0 || isProcessing) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                  }
                  setIsAILoading(false);
                };

                while (true) {
                  const { done: opponentDone, value: opponentValue } = await opponentReader.read();
                  if (opponentDone) {
                    await waitForCompletion();
                    break;
                  }

                  const opponentChunk = opponentDecoder.decode(opponentValue);
                  const opponentLines = opponentChunk.split('\n');

                  for (const line of opponentLines) {
                    if (line.startsWith('data: ')) {
                      const data = line.slice(6);
                      if (data === '[DONE]') {
                        await waitForCompletion();
                      } else {
                        try {
                          const parsed = JSON.parse(data);
                          if (parsed.type === 'chunk' && parsed.content) {
                            for (const char of parsed.content) {
                              charQueue.push(char);
                            }
                            if (!isProcessing) {
                              processCharQueue();
                            }
                          } else if (parsed.type === 'citations' && parsed.citations) {
                            setMessages(prev => {
                              const newMessages = [...prev];
                              const currentMessage = newMessages[aiMessageIndex];
                              newMessages[aiMessageIndex] = { 
                                ...currentMessage,
                                citations: parsed.citations
                              };
                              return newMessages;
                            });
                          } else if (parsed.type === 'search_start') {
                            if (isAILoading) {
                              setIsAILoading(false);
                            }
                          } else if (parsed.type === 'completed') {
                            waitForCompletion();
                          }
                        } catch (e) {
                          // Skip invalid JSON
                        }
                      }
                    }
                  }
                }
              }
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'chunk' && parsed.content) {
                  // Clear search message immediately when first content arrives
                  if (accumulatedAiArgument === '') {
                    setMessages(prev => {
                      const newMessages = [...prev];
                      if (newMessages[userMessageIndex]?.isSearching) {
                        newMessages[userMessageIndex] = { 
                          ...newMessages[userMessageIndex],
                          content: '',
                          isSearching: false  // Clear searching flag
                        };
                      }
                      return newMessages;
                    });
                    setIsUserLoading(true); // Re-enable loading state for cursor
                  }
                  // Add characters to the queue for streaming
                  for (const char of parsed.content) {
                    charQueue.push(char);
                  }
                  if (!isProcessing) {
                    processCharQueue();
                  }
                } else if (parsed.type === 'search_start') {
                  // Show search indicator (will be replaced when content arrives)
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[userMessageIndex] = { 
                      ...newMessages[userMessageIndex],
                      content: '🔍 Searching the web',
                      isSearching: true  // Add flag to trigger dots animation
                    };
                    return newMessages;
                  });
                  // Keep loading state true so cursor shows when content arrives
                } else if (parsed.type === 'citations' && parsed.citations) {
                  // Update citations on the message
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[userMessageIndex] = { 
                      ...newMessages[userMessageIndex],
                      citations: parsed.citations
                    };
                    return newMessages;
                  });
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('AI takeover error:', error);
      alert('Failed to generate AI argument. Please try again.');
      setIsAILoading(false);
      setIsUserLoading(false);
    } finally {
      setIsAITakeover(false);
      setIsLoading(false);
      setIsUserLoading(false);
    }
  };

  // Show loading state while checking auth or loading debate
  if (isSignedIn === undefined || isLoadingDebate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-xl font-medium text-slate-100 mb-3">
            {isSignedIn === undefined ? 'Checking authentication...' : 'Preparing debate arena'}
          </div>
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
        <div className="flex-1 overflow-y-auto relative" onScroll={handleScroll}>
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
                debate={debate}
                isAILoading={isAILoading && idx === messages.length - 1}
                isUserLoading={isUserLoading && idx === messages.length - 1}
                msgIndex={idx}
              />
            ))}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Auto-scroll indicator - only show during active streaming */}
          {!isAutoScrollEnabled && isLoading && (
            <div className="absolute bottom-24 right-4 bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-full border border-slate-700 animate-fade-in">
              Auto-scroll paused • Scroll to bottom to resume
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Input Area - Fixed */}
      <div className="border-t border-slate-700 bg-slate-900 flex-shrink-0">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  const newHeight = Math.min(e.target.scrollHeight, 200);
                  e.target.style.height = newHeight + 'px';
                  // Only show scrollbar if content exceeds max height
                  e.target.style.overflowY = e.target.scrollHeight > 200 ? 'auto' : 'hidden';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your argument... (Shift+Enter for new line)"
                className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none text-slate-100 placeholder-slate-500 resize-none leading-6"
                style={{ minHeight: '48px', maxHeight: '200px', overflowY: 'hidden' }}
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleAITakeover}
                disabled={isLoading || isAITakeover}
                className={`absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md transition-all group ${
                  isLoading || isAITakeover
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
                title="Let AI argue for you"
              >
                {/* Tooltip */}
                <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-slate-200 bg-slate-800 rounded border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  AI will argue for you
                </span>
                {isAITakeover ? (
                  <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </button>
            </div>
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