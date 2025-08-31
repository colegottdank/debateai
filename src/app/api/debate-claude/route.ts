import { NextResponse } from 'next/server';
import { debateStreamToSSE } from '@/lib/anthropic-debate';
import { OpponentType } from '@/lib/opponents';
import { getUserId } from '@/lib/auth-helper';
import { d1 } from '@/lib/d1';

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      debateId, 
      opponent, 
      topic, 
      userArgument, 
      previousMessages,
      isFirstTurn 
    } = await request.json();

    if (!debateId || !opponent || !topic || !userArgument) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check message limit (skip in test mode)
    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';
    if (!isTestMode) {
      const messageLimit = await d1.checkDebateMessageLimit(debateId);
      if (!messageLimit.allowed) {
        return NextResponse.json({ 
          error: 'message_limit_exceeded',
          message: `You've reached your limit of ${messageLimit.limit} messages per debate. Upgrade to premium for unlimited messages!`,
          current: messageLimit.count,
          limit: messageLimit.limit,
          upgrade_required: true
        }, { status: 429 });
      }
    }

    // Calculate turn number
    const turnNumber = previousMessages 
      ? Math.floor(previousMessages.filter((m: any) => m.role === 'user').length) + 1
      : 1;

    console.log(`Starting Claude Code debate stream for ${debateId}, turn ${turnNumber}`);

    // Create the SSE stream
    const encoder = new TextEncoder();
    let fullResponse = '';
    
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Stream the Anthropic response
          for await (const sseChunk of debateStreamToSSE(
            debateId,
            opponent as OpponentType,
            topic,
            userArgument,
            turnNumber,
            isFirstTurn,
            previousMessages
          )) {
            controller.enqueue(encoder.encode(sseChunk));
            
            // Extract the response text for saving
            if (sseChunk.includes('"type":"chunk"')) {
              const match = sseChunk.match(/"content":"([^"]+)"/);
              if (match) {
                fullResponse += match[1];
              }
            } else if (sseChunk.includes('"type":"complete"')) {
              const match = sseChunk.match(/"content":"([^"]+)"/);
              if (match) {
                fullResponse = match[1]; // Use complete response if available
              }
            }
          }

          // Save the debate messages to database
          if (fullResponse) {
            const allMessages = [
              ...(previousMessages || []),
              { role: 'user', content: userArgument },
              { role: 'ai', content: fullResponse }
            ];

            console.log(`Saving debate ${debateId} with ${allMessages.length} messages`);
            
            await d1.saveDebate({
              userId,
              opponent: opponent as OpponentType,
              topic,
              messages: allMessages,
              debateId
            });
          }
        } catch (error) {
          console.error('Error in debate stream:', error);
          const errorMessage = JSON.stringify({ 
            type: 'error', 
            content: 'Failed to generate response' 
          });
          controller.enqueue(encoder.encode(`data: ${errorMessage}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in debate API:', error);
    return NextResponse.json(
      { error: 'Failed to process debate request' },
      { status: 500 }
    );
  }
}