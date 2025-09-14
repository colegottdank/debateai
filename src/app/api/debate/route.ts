import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getUserId } from "@/lib/auth-helper";
import { d1 } from "@/lib/d1";
import { getDebatePrompt, getDailyPersona } from "@/lib/prompts";
import { checkAppDisabled } from "@/lib/app-disabled";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: process.env.HELICONE_BASE_URL || "https://anthropic.helicone.ai",
  defaultHeaders: process.env.HELICONE_API_KEY
    ? {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      }
    : {},
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

    // Get the appropriate system prompt from our centralized prompts
    // Always use the persona-based prompt (either custom or daily)
    const persona = opponentStyle || getDailyPersona();
    const systemPrompt = getDebatePrompt(persona, topic);

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
    // eslint-disable-next-line prefer-const
    let controllerClosed = false; // Track if controller is closed

    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          // Send initial message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`)
          );

          const stream = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 600, // Further reduced to enforce brevity
            temperature: 0.7,
            system: systemPrompt,
            messages: messages,
            stream: true,
            tools: [
              {
                type: "web_search_20250305",
                name: "web_search",
                max_uses: 1,
              },
            ],
          });

          let accumulatedContent = "";
          let buffer = "";
          let lastFlushTime = Date.now();
          const BUFFER_TIME = 20; // Reduced to 20ms for faster streaming
          const BUFFER_SIZE = 8; // Send 8 characters at a time for better speed
          const citations: any[] = [];
          let citationCounter = 1;

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

          for await (const event of stream) {
            if (event.type === "content_block_start") {
              if (
                event.content_block?.type === "server_tool_use" &&
                event.content_block.name === "web_search"
              ) {
                // Web search is starting
                if (buffer) {
                  flushBuffer();
                }

                if (!controllerClosed) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "search_start",
                        query: "Searching the web...",
                      })}\n\n`
                    )
                  );
                }
              } else if (
                event.content_block?.type === "web_search_tool_result"
              ) {
                // Web search results received (old format - kept for compatibility)
                const results = (event.content_block as any).content || [];
                const extractedCitations: any[] = [];

                results.forEach((result: any) => {
                  if (result.type === "web_search_result" && result.url) {
                    extractedCitations.push({
                      id: citationCounter++,
                      url: result.url,
                      title: result.title || new URL(result.url).hostname,
                    });
                  }
                });

                if (extractedCitations.length > 0) {
                  citations.push(...extractedCitations);
                }
              } else if (
                // Handle new citation format with embedded citations
                event.content_block?.type === "text" &&
                (event.content_block as any).citations
              ) {
                // Text block with citations - new format
                const blockCitations = (event.content_block as any).citations || [];
                // Process citations but don't increment counter yet
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const chunk = event.delta.text;
                accumulatedContent += chunk;
              } else if (event.delta.type === "citations_delta") {
                // Handle new citation format
                const citation = (event.delta as any).citation;
                if (citation && citation.type === "web_search_result_location") {
                  // Extract citation and add [N] marker
                  const citationData = {
                    id: citationCounter,
                    url: citation.url,
                    title: citation.title || new URL(citation.url).hostname,
                    cited_text: citation.cited_text
                  };

                  // Check if this citation already exists
                  const exists = citations.find(c => c.url === citation.url);
                  if (!exists) {
                    citations.push(citationData);
                    citationCounter++;

                    // Add citation marker to accumulated content
                    accumulatedContent += ` [${citationData.id}]`;

                    // Also add to buffer for streaming
                    buffer += ` [${citationData.id}]`;
                  } else {
                    // Use existing citation number
                    accumulatedContent += ` [${exists.id}]`;
                    buffer += ` [${exists.id}]`;
                  }
                }
              } else if (event.delta.type === "text_delta") {
                const chunk = event.delta.text;
                accumulatedContent += chunk;

                // Add characters to buffer one by one
                for (const char of chunk) {
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
            } else if (event.type === "message_stop") {
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

              // Send all citations since we now add markers when they're received
              if (citations.length > 0 && !controllerClosed) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "citations",
                      citations: citations,
                    })}\n\n`
                  )
                );
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
                    ...(citations.length > 0 && { citations: citations }),
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

              // Send completion message with filtered citations
              if (!controllerClosed) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "complete",
                      content: accumulatedContent,
                      debateId: debateId,
                      citations: citations.length > 0 ? citations : undefined,
                    })}\n\n`
                  )
                );
              }
            }
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
