import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-helper";
import { d1 } from "@/lib/d1";
import { getDebatePrompt, getDailyPersona } from "@/lib/prompts";
import { checkAppDisabled } from "@/lib/app-disabled";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: `${process.env.HELICONE_API_KEY}`,
  baseURL: "https://ai-gateway.helicone.ai",
});

export async function POST(request: Request) {
  // Check if app is disabled
  const disabledResponse = checkAppDisabled();
  if (disabledResponse) return disabledResponse;

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
      isAIAssisted, // Flag to indicate if this was an AI-assisted message
    } = await request.json();

    if (!character || !topic || !userArgument) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check message limit
    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
    const isLocalDev =
      process.env.NODE_ENV === "development" ||
      process.env.LOCAL_DEV_BYPASS === "true";
    if (debateId && !isTestMode && !isLocalDev) {
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

    // Get the appropriate system prompt from our centralized prompts
    // Always use the persona-based prompt (either custom or daily)
    const persona = opponentStyle || getDailyPersona();
    const systemPrompt = getDebatePrompt(persona, topic);

    // Build conversation history for OpenAI SDK format
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system prompt as first message
    messages.push({ role: "system", content: systemPrompt });

    // Add previous messages if they exist
    if (previousMessages && previousMessages.length > 0) {
      for (const msg of previousMessages) {
        // Skip empty messages - Anthropic API requires non-empty content
        if (!msg.content || msg.content.trim() === "") continue;

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
    // eslint-disable-next-line prefer-const
    let controllerClosed = false; // Track if controller is closed

    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          // Send initial message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`)
          );

          const stream = await openai.chat.completions.create({
            model: "claude-sonnet-4:online/anthropic",
            max_tokens: 600,
            temperature: 0.7,
            messages: messages,
            stream: true,
          });

          let accumulatedContent = "";
          let buffer = "";
          let lastFlushTime = Date.now();
          const BUFFER_TIME = 20; // Reduced to 20ms for faster streaming
          const BUFFER_SIZE = 8; // Send 8 characters at a time for better speed

          // Simple flush function for character streaming
          const flushBuffer = () => {
            if (buffer && !controllerClosed) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "chunk",
                    content: buffer,
                  })}\n\n`
                )
              );
              buffer = "";
              lastFlushTime = Date.now();
            }
          };

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;

            if (content) {
              accumulatedContent += content;

              // Add characters to buffer one by one
              for (const char of content) {
                buffer += char;

                // Flush small chunks frequently
                const now = Date.now();
                if (
                  buffer.length >= BUFFER_SIZE ||
                  (now - lastFlushTime >= BUFFER_TIME && buffer.length > 0)
                ) {
                  flushBuffer();
                }
              }
            }
          }

          // Flush any remaining buffer
          if (buffer && !controllerClosed) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "chunk",
                  content: buffer,
                })}\n\n`
              )
            );
            buffer = "";
          }

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
                ...(isAIAssisted && { aiAssisted: true }),
              });
              existingMessages.push({
                role: "ai",
                content: accumulatedContent,
              });

              await d1.saveDebate({
                userId,
                opponent: character,
                topic: existingDebate.debate.topic || topic, // Preserve original topic
                messages: existingMessages,
                debateId,
                opponentStyle,
              });
            }
          }

          // Send completion message
          if (!controllerClosed) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "complete",
                  content: accumulatedContent,
                  debateId: debateId,
                })}\n\n`
              )
            );
            // Send [DONE] signal to ensure frontend knows streaming is complete
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          }
        } catch (error) {
          console.error("Streaming error:", error);
          if (!controllerClosed) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  error: "Failed to generate response",
                })}\n\n`
              )
            );
          }
        } finally {
          controllerClosed = true;
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
