import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getUserId } from "@/lib/auth-helper";
import { d1 } from "@/lib/d1";
import { checkAppDisabled } from "@/lib/app-disabled";
import { getTakeoverPrompt } from "@/lib/prompts";

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

    const { debateId, topic, previousMessages, opponentStyle } =
      await request.json();

    if (!topic || !debateId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check message limit for free users
    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
    if (!isTestMode) {
      const messageLimit = await d1.checkDebateMessageLimit(debateId);
      if (!messageLimit.allowed && !messageLimit.isPremium) {
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

    // Build conversation history for context
    const conversationHistory = (previousMessages || [])
      .map((msg: any) => {
        if (msg.role === "user") {
          return `Human's argument: ${msg.content}`;
        } else if (msg.role === "ai") {
          return `Opponent's argument: ${msg.content}`;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n");

    // Extract the user's position from their previous arguments
    const userArguments = (previousMessages || [])
      .filter((msg: any) => msg.role === "user")
      .map((msg: any) => msg.content)
      .join(" ");

    // Get the takeover prompt from centralized prompts
    const systemPrompt = getTakeoverPrompt(topic, opponentStyle, conversationHistory, userArguments);

    const lastOpponentMessage =
      (previousMessages || []).filter((msg: any) => msg.role === "ai").pop()?.content ||
      "";

    const userPrompt = lastOpponentMessage
      ? `The opponent just said: "${lastOpponentMessage}"\n\nGenerate my response arguing for my position.`
      : `Generate my opening argument for this debate on "${topic}".`;

    // Generate the AI takeover response
    // eslint-disable-next-line prefer-const
    let controllerClosed = false; // Track if controller is closed

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 400, // Strictly enforce brevity for takeover
            temperature: 0.7,
            system: systemPrompt,
            messages: [
              {
                role: "user",
                content: userPrompt,
              },
            ],
            stream: true,
            tools: [
              {
                type: "web_search_20250305",
                name: "web_search",
                max_uses: 1,
              },
            ],
          });

          let buffer = "";
          let accumulatedContent = ""; // Track full content for citation filtering
          let lastFlushTime = Date.now();
          const BUFFER_TIME = 50; // Slower for more human-like streaming
          const BUFFER_SIZE = 5; // Smaller chunks for smoother flow
          const citations: any[] = [];
          let citationCounter = 1;

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

          for await (const event of response) {
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
              if (event.delta.type === "citations_delta") {
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
                  const exists = citations.find((c: any) => c.url === citation.url);
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
                accumulatedContent += chunk; // Accumulate for citation filtering

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
            }
          }

          // Flush any remaining buffer
          if (buffer) {
            flushBuffer();
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

          if (!controllerClosed) {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          }
        } catch (error) {
          console.error("AI Takeover error:", error);
          if (!controllerClosed) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: "Failed to generate AI argument",
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

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI takeover error:", error);
    return NextResponse.json(
      { error: "Failed to process AI takeover" },
      { status: 500 }
    );
  }
}
