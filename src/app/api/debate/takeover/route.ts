import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getUserId } from "@/lib/auth-helper";
import { d1 } from "@/lib/d1";
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
    const conversationHistory = previousMessages
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
    const userArguments = previousMessages
      .filter((msg: any) => msg.role === "user")
      .map((msg: any) => msg.content)
      .join(" ");

    const systemPrompt = `You are an AI assistant helping a human in a debate about "${topic}".

${opponentStyle ? `The opponent is ${opponentStyle}. Match their energy and debate style while maintaining substance. If they're aggressive and confrontational, be bold and assertive in response. If they're comedic, add wit. If they're academic, be scholarly. BUT always prioritize strong arguments over pure style.` : ""}

Based on the human's previous arguments, you need to continue arguing from THEIR perspective and position.
Generate ONE strong, compelling argument that:
1. Continues their line of reasoning
2. Addresses the opponent's latest points directly and forcefully
3. Uses evidence and logic as your foundation
4. Maintains consistency with their previous arguments
5. Is concise and impactful - aim for 150-200 words (about 2-3 short paragraphs)
${opponentStyle ? "\n6. Match the opponent's energy - if they're being dramatic, don't be timid. Use emphatic language, rhetorical questions, and strong statements. Light personality touches are good (like 'Listen,' or 'Here's the thing') but avoid stage directions or physical descriptions." : ""}

Citation Guidelines:
1. Use web search ONLY when making specific factual claims that would benefit from verification (e.g., recent statistics, controversial facts, or claims central to your argument).
2. Do NOT search for commonly known facts, general statements, or philosophical arguments.
3. When you do search, add citation markers [1], [2], etc. inline where you reference the information.
4. Quality over quantity - a strong logical argument is better than many weak citations.
5. Use citations strategically to strengthen key points, not for every statement.

Previous debate context:
${conversationHistory}

The human's position (based on their arguments): ${
      userArguments
        ? `The human has been arguing: ${userArguments.substring(0, 500)}...`
        : "The human is just starting the debate."
    }

Now generate the next argument FROM THE HUMAN'S PERSPECTIVE. Do not switch sides or argue against their position.
${opponentStyle ? "\nWrite naturally and conversationally - this is a debate, not an essay. Show confidence and conviction." : ""}`;

    const lastOpponentMessage =
      previousMessages.filter((msg: any) => msg.role === "ai").pop()?.content ||
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
            max_tokens: 1000,
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
                max_uses: 3,
              },
            ],
          });

          let buffer = "";
          let lastFlushTime = Date.now();
          const BUFFER_TIME = 20;
          const BUFFER_SIZE = 8;
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
                // Web search results received
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

                  // Send citations to frontend immediately
                  if (!controllerClosed) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: "citations",
                          citations: extractedCitations,
                        })}\n\n`
                      )
                    );
                  }
                }
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const chunk = event.delta.text;

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
