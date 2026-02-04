import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { getUserId } from '@/lib/auth-helper';

// In-memory fallback for when D1 is not configured
const memoryDebates = new Map<string, any>();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ debateId: string }> }
) {
  try {
    const { debateId } = await params;
    const userId = await getUserId();
    
    if (!debateId) {
      return NextResponse.json({ error: 'Debate ID required' }, { status: 400 });
    }

    // Try memory first
    const memoryDebate = memoryDebates.get(debateId);
    if (memoryDebate) {
      return NextResponse.json({ 
        debate: memoryDebate,
        isOwner: true,
        isAuthenticated: !!userId 
      });
    }

    // Try D1
    const result = await d1.getDebate(debateId);
    
    if (result.success && result.debate) {
      const isOwner = userId ? result.debate.user_id === userId : false;
      const isAuthenticated = !!userId;
      
      return NextResponse.json({ 
        debate: result.debate,
        isOwner,
        isAuthenticated 
      });
    } else {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Get debate error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve debate' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ debateId: string }> }
) {
  try {
    const { debateId } = await params;
    const userId = await getUserId();
    
    if (!debateId) {
      return NextResponse.json({ error: 'Debate ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { message, aiTakeover } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create debate in memory
    let debate = memoryDebates.get(debateId);
    
    if (!debate) {
      // Try to get from D1
      const debateResult = await d1.getDebate(debateId);
      if (debateResult.success && debateResult.debate) {
        debate = debateResult.debate;
      } else {
        // Create a new memory debate
        debate = {
          id: debateId,
          user_id: userId || 'anonymous',
          opponent: 'custom',
          opponentStyle: 'AI Opponent',
          topic: 'Debate',
          messages: [],
          created_at: new Date().toISOString()
        };
      }
      memoryDebates.set(debateId, debate);
    }

    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      aiAssisted: aiTakeover || false,
      created_at: new Date().toISOString()
    };

    debate.messages = [...(debate.messages || []), userMessage];

    // Try to save to D1 (don't fail if it doesn't work)
    try {
      await d1.addMessage(debateId, userMessage);
    } catch (e) {
      console.log('D1 save failed, using memory only');
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(debate, debate.messages, message);

    // Add AI message
    const aiMessage = {
      role: 'ai',
      content: aiResponse,
      created_at: new Date().toISOString()
    };

    debate.messages.push(aiMessage);

    // Try to save AI message to D1
    try {
      await d1.addMessage(debateId, aiMessage);
    } catch (e) {
      console.log('D1 save failed for AI message, using memory only');
    }

    return NextResponse.json({ 
      success: true,
      userMessage,
      aiMessage
    });
    
  } catch (error) {
    console.error('Post message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Helper function to generate AI response
async function generateAIResponse(debate: any, messages: any[], userMessage: string) {
  // Check if we have an AI service configured
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
  const AI_API_KEY = process.env.AI_API_KEY;
  
  if (AI_SERVICE_URL && AI_API_KEY) {
    try {
      const response = await fetch(AI_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          topic: debate.topic,
          opponent: debate.opponentStyle || debate.opponent || debate.character,
          messages: messages,
          userMessage: userMessage
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.response || data.message || data.content;
      }
    } catch (error) {
      console.error('AI service error:', error);
    }
  }
  
  // Fallback responses based on persona
  const fallbacks: Record<string, string[]> = {
    'Elon Musk': [
      "I disagree. The free market will naturally find the right balance without government intervention. History has shown that excessive regulation often creates more problems than it solves.",
      "We need to move fast and break things. That's how innovation happens. Bureaucracy slows down progress.",
      "Regulation stifles innovation. Let the market self-regulate through competition and consumer choice.",
      "The best solutions come from free people experimenting, not from government committees writing rules about technology they don't understand."
    ],
    'Jordan Peterson': [
      "That's a simplistic view. Let's examine the deeper psychological and historical patterns at play here...",
      "You need to consider the archetypal structures underlying this issue. Order and chaos must be balanced.",
      "Have you considered the long-term consequences of that position? We must think carefully about the path we choose."
    ],
    'Alexandria Ocasio-Cortez': [
      "We need systemic change, not band-aid solutions. The current system isn't working for everyday people.",
      "This is about justice and equity. We can't ignore the marginalized communities affected by these policies.",
      "The data clearly shows we need bold action. Incrementalism won't solve the scale of this problem."
    ],
    'Ben Shapiro': [
      "Facts don't care about your feelings. Let's look at the actual data here.",
      "Your argument is emotionally appealing but logically flawed. Here's why...",
      "The statistics tell a different story. Let's examine the evidence objectively."
    ],
    'default': [
      "That's an interesting perspective. However, I see it differently based on the evidence available.",
      "I understand your point, but consider this counterargument...",
      "While that sounds reasonable, there's another side to consider that you may have overlooked.",
      "Let me offer a different perspective on this issue...",
      "That's a compelling argument, but I think there are some flaws in the reasoning."
    ]
  };
  
  const personaKey = debate.opponentStyle || debate.opponent || debate.character || 'default';
  const personaResponses = fallbacks[personaKey] || fallbacks['default'];
  return personaResponses[Math.floor(Math.random() * personaResponses.length)];
}
