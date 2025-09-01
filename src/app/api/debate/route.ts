import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getUserId } from "@/lib/auth-helper";
import { d1 } from "@/lib/d1";
import { OPPONENT_PROMPTS } from "@/lib/debate-prompts";
import { OpponentType } from "@/lib/opponents";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      debateId,
      character, // This will be the opponent type or 'custom'
      opponentStyle, // Custom opponent style description
      topic,
      userArgument,
      previousMessages,
    } = await request.json();

    if (!character || !topic || !userArgument) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check message limit
    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
    if (debateId && !isTestMode) {
      const messageLimit = await d1.checkDebateMessageLimit(debateId);
      if (!messageLimit.allowed) {
        return NextResponse.json(
          {
            error: "message_limit_exceeded",
            message: `You've reached your limit of ${messageLimit.limit} messages per debate. Upgrade to premium for unlimited messages!`,
            current: messageLimit.count,
            limit: messageLimit.limit,
            upgrade_required: true,
          },
          { status: 429 }
        );
      }
    }

    // Calculate turn number based on previous messages
    const turnNumber = previousMessages
      ? Math.floor(
          previousMessages.filter((m: any) => m.role === "user").length
        ) + 1
      : 1;

    // Build system prompt based on custom style or predefined opponent
    let systemPrompt: string;

    if (character === "custom" && opponentStyle) {
      // Use custom opponent style
      systemPrompt = `You are a debate opponent with the following style: ${opponentStyle}

Topic: "${topic}"

Engage in this debate according to your described style. Respond to arguments directly and substantively. Keep responses under 100 words. Be challenging but respectful.`;
    } else {
      // Fall back to predefined opponents if available
      const opponentPrompt =
        OPPONENT_PROMPTS[character as OpponentType] ||
        OPPONENT_PROMPTS.socratic;
      systemPrompt = `${opponentPrompt}

Topic: "${topic}"
You are engaged in a debate with the user about this topic. Respond to their arguments directly and substantively.`;
    }

    // Build conversation history for Claude
    const messages: Anthropic.MessageParam[] = [];

    // Add previous messages if they exist
    if (previousMessages && previousMessages.length > 0) {
      for (const msg of previousMessages) {
        if (msg.role === "user") {
          messages.push({ role: "user", content: msg.content });
        } else if (msg.role === "ai") {
          messages.push({ role: "assistant", content: msg.content });
        }
      }
    }

    // Add the current user argument
    messages.push({ role: "user", content: userArgument });

    // Always use streaming response
    const encoder = new TextEncoder();
    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          // Send initial message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`)
          );

          const stream = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            temperature: 0.7,
            system: systemPrompt,
            messages: messages,
            stream: true,
            tools: [
              {
                type: "web_search_20250305",
                name: "web_search",
                max_uses: 5,
              },
            ],
          });

          let accumulatedContent = "";

          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const chunk = event.delta.text;
                accumulatedContent += chunk;

                // Send chunk to client
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "chunk",
                      content: chunk,
                    })}\n\n`
                  )
                );
              }
            } else if (event.type === "message_stop") {
              // Save the complete debate turn - fetch existing debate, add messages, and save
              if (debateId && accumulatedContent) {
                const existingDebate = await d1.getDebate(debateId);
                if (existingDebate.success && existingDebate.debate) {
                  const existingMessages = Array.isArray(
                    existingDebate.debate.messages
                  )
                    ? existingDebate.debate.messages
                    : [];
                  existingMessages.push({
                    role: "user",
                    content: userArgument,
                  });
                  existingMessages.push({
                    role: "ai",
                    content: accumulatedContent,
                  });

                  await d1.saveDebate({
                    userId,
                    opponent: character,
                    topic,
                    messages: existingMessages,
                    debateId,
                  });
                }
              }

              // Send completion message
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "complete",
                    content: accumulatedContent,
                    debateId: debateId,
                  })}\n\n`
                )
              );
            }
          }
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: "Failed to generate response",
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(streamResponse, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Debate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate debate response" },
      { status: 500 }
    );
  }
}
