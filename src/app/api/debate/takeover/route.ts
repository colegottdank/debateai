import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-helper";
import { d1 } from "@/lib/d1";
import { checkAppDisabled } from "@/lib/app-disabled";
import { getTakeoverPrompt } from "@/lib/prompts";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { errors, validateBody } from "@/lib/api-errors";
import { takeoverSchema } from "@/lib/api-schemas";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  baseURL: "https://anthropic.helicone.ai",
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// 10 takeover requests per minute per user
const userLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });
const ipLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });

export async function POST(request: Request) {
  // Check if app is disabled
  const disabledResponse = checkAppDisabled();
  if (disabledResponse) return disabledResponse;

  // IP-based rate limit first
  const ipRl = ipLimiter.check(getClientIp(request));
  if (!ipRl.allowed) {
    return rateLimitResponse(ipRl);
  }

  try {
    const userId = await getUserId();

    if (!userId) {
      return errors.unauthorized();
    }

    // Per-user rate limit
    const userRl = userLimiter.check(`user:${userId}`);
    if (!userRl.allowed) {
      return rateLimitResponse(userRl);
    }

    // Validate request body
    const { debateId, topic, previousMessages, opponentStyle } = await validateBody(
      request,
      takeoverSchema
    );

    // Check message limit for free users
    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
    const isLocalDev =
      process.env.NODE_ENV === "development" ||
      (process.env.NODE_ENV !== "production" && process.env.LOCAL_DEV_BYPASS === "true");
    if (!isTestMode && !isLocalDev) {
      const messageLimit = await d1.checkDebateMessageLimit(debateId);
      if (!messageLimit.allowed && !messageLimit.isPremium) {
        return errors.messageLimit(messageLimit.count, messageLimit.limit);
      }
    }

    // Build conversation history for context
    const conversationHistory = (previousMessages || [])
      .map((msg) => {
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
      .filter((msg) => msg.role === "user")
      .map((msg) => msg.content)
      .join(" ");

    // Get the takeover prompt from centralized prompts
    const systemPrompt = getTakeoverPrompt(
      topic,
      opponentStyle || "",
      conversationHistory,
      userArguments
    );

    const lastOpponentMessage =
      (previousMessages || []).filter((msg) => msg.role === "ai").pop()
        ?.content || "";

    const userPrompt = lastOpponentMessage
      ? `The opponent just said: "${lastOpponentMessage}"\n\nGenerate my response arguing for my position.`
      : `Generate my opening argument for this debate on "${topic}".`;

    // Build messages for Anthropic SDK format
    const messages: Anthropic.MessageParam[] = [];
    
    // Inject reminder about citations
    messages.push({
      role: "user",
      content: userPrompt
    });
    
    messages.push({
      role: "assistant",
      content: "Understood. I will ONLY use citation markers [1], [2] if I actually perform a web search and retrieve real sources. I will NOT hallucinate citation numbers without searching."
    });
    messages.push({
      role: "user",
      content: "Correct. Now provide your response."
    });

    // Generate the AI takeover response
    let controllerClosed = false;

    const streamResponse = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const stream = anthropic.messages.stream({
            model: "claude-sonnet-4-20250514", // Following CLAUDE.md
            max_tokens: 1000,
            system: systemPrompt,
            messages: messages,
            tools: [
              {
                type: "web_search_20250305",
                name: "web_search",
                max_uses: 2,
              },
            ],
          }, {
            headers: {
              "Helicone-User-Id": userId,
              "Helicone-RateLimit-Policy": "100;w=86400;s=user",
            },
          });

          let buffer = "";
          let lastFlushTime = Date.now();
          const BUFFER_TIME = 50;
          const BUFFER_SIZE = 5;
          const citations: { id: number; url: string; title: string }[] = [];
          let citationCounter = 1;
          let searchIndicatorSent = false;

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
          
          stream.on("text", (text) => {
             buffer += text;
             const now = Date.now();
             if (buffer.length >= BUFFER_SIZE || (now - lastFlushTime >= BUFFER_TIME && buffer.length > 0)) {
               flushBuffer();
             }
          });

          // Handle content block events for web search
          (stream as any).on("contentBlockStart", (event: any) => {
            if (event.content_block?.type === "server_tool_use" && event.content_block?.name === "web_search") {
              if (!searchIndicatorSent) {
                searchIndicatorSent = true;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "search_start",
                    })}\n\n`
                  )
                );
              }
            }
          });

          // Handle final message for citations
          const finalMessage = await stream.finalMessage();
          
          // Citation extraction logic
          const MAX_CITATIONS = 5;
          const seenUrls = new Set<string>();

          for (const block of finalMessage.content) {
            if (block.type === "text") {
              const textBlock = block as typeof block & {
                citations?: Array<{
                  type: string;
                  url: string;
                  title?: string;
                }>;
              };

              if (textBlock.citations && Array.isArray(textBlock.citations)) {
                for (const citation of textBlock.citations) {
                  if (citations.length >= MAX_CITATIONS) break;
                  if (citation.type === "web_search_result_location" && citation.url) {
                    if (!seenUrls.has(citation.url)) {
                      seenUrls.add(citation.url);
                      citations.push({
                        id: citationCounter++,
                        url: citation.url,
                        title: citation.title || new URL(citation.url).hostname,
                      });
                    }
                  }
                }
              }
            }
          }
          
          // Fallback extraction
          if (citations.length === 0) {
            for (const block of finalMessage.content) {
              if (block.type === "web_search_tool_result") {
                 const resultBlock = block as typeof block & { content?: Array<{ type: string; url?: string; title?: string }> };
                 if (resultBlock.content && Array.isArray(resultBlock.content)) {
                    for (const result of resultBlock.content) {
                        if (citations.length >= MAX_CITATIONS) break;
                        if (result.type === "web_search_result" && result.url) {
                           if (!seenUrls.has(result.url)) {
                               seenUrls.add(result.url);
                               citations.push({
                                   id: citationCounter++,
                                   url: result.url,
                                   title: result.title || new URL(result.url).hostname
                               });
                           }
                        }
                    }
                 }
              }
            }
          }

          if (citations.length > 0 && !controllerClosed) {
            if (buffer) flushBuffer();
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "citations",
                  citations: citations,
                })}\n\n`
              )
            );
          }

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
                  type: "error",
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

    return new Response(streamResponse, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("AI takeover error:", error);
    return errors.internal("Failed to process AI takeover");
  }
}
