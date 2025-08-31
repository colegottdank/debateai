import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUserId } from '@/lib/auth-helper';
import { d1 } from '@/lib/d1';
import { OPPONENT_PROMPTS } from '@/lib/debate-prompts';
import { OpponentType } from '@/lib/opponents';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      debateId, 
      character,  // This will be the opponent type
      topic, 
      userArgument, 
      previousMessages,
      stream = true
    } = await request.json();

    if (!character || !topic || !userArgument) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check message limit
    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';
    if (debateId && !isTestMode) {
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

    // Calculate turn number based on previous messages
    const turnNumber = previousMessages 
      ? Math.floor(previousMessages.filter((m: any) => m.role === 'user').length) + 1
      : 1;

    // Get the opponent-specific prompt from the prompts configuration
    const opponentPrompt = OPPONENT_PROMPTS[character as OpponentType] || OPPONENT_PROMPTS.socratic;
    
    // Build the full system prompt
    const systemPrompt = `${opponentPrompt}

Topic: "${topic}"
You are engaged in a debate with the user about this topic. Respond to their arguments directly and substantively.`;

    // Build conversation history for Claude
    const messages: Anthropic.MessageParam[] = [];
    
    // Add previous messages if they exist
    if (previousMessages && previousMessages.length > 0) {
      for (const msg of previousMessages) {
        if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'ai') {
          messages.push({ role: 'assistant', content: msg.content });
        }
      }
    }
    
    // Add the current user argument
    messages.push({ role: 'user', content: userArgument });

    if (!stream) {
      // Non-streaming response
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages
      });

      // Extract the text content from the response
      let finalContent = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          finalContent += block.text;
        }
      }

      // Save the debate turn
      if (debateId) {
        await d1.saveDebateTurn(debateId, userArgument, finalContent);
      }

      return NextResponse.json({ 
        content: finalContent,
        debateId: debateId 
      });
    }

    // Streaming response
    const encoder = new TextEncoder();
    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          // Send initial message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`)
          );

          const stream = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 1000,
            temperature: 0.7,
            system: systemPrompt,
            messages: messages,
            stream: true
          });

          let accumulatedContent = '';

          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                const chunk = event.delta.text;
                accumulatedContent += chunk;
                
                // Send chunk to client
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    type: 'chunk', 
                    content: chunk 
                  })}\n\n`)
                );
              }
            } else if (event.type === 'message_stop') {
              // Save the complete debate turn
              if (debateId && accumulatedContent) {
                await d1.saveDebateTurn(debateId, userArgument, accumulatedContent);
              }

              // Send completion message
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'complete', 
                  content: accumulatedContent,
                  debateId: debateId 
                })}\n\n`)
              );
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: 'Failed to generate response' 
            })}\n\n`)
          );
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(streamResponse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Debate API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate debate response' },
      { status: 500 }
    );
  }
}