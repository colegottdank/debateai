import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserId } from "@/lib/auth-helper";
import { d1 } from "@/lib/d1";
import { checkAppDisabled } from "@/lib/app-disabled";
import { getTakeoverPrompt } from "@/lib/prompts";
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { errors, validateBody } from "@/lib/api-errors";
import { takeoverSchema } from "@/lib/api-schemas";

const openai = new OpenAI({
  apiKey: `${process.env.HELICONE_API_KEY}`,
  baseURL: "https://ai-gateway.helicone.ai",
});

// 10 takeover requests per minute per user (calls OpenAI API)
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

    // Build messages for OpenAI SDK format
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: userPrompt });

    // Inject reminder about citations to keep it fresh in context
    messages.push({
      role: "assistant",
      content: "Understood. I will ONLY use citation markers [1], [2] if I actually perform a web search and retrieve real sources. I will NOT hallucinate citation numbers without searching. If I don't search, I won't use any citation markers."
    });
    messages.push({
      role: "user",
      content: "Correct. Now provide your response."
    });

    // Generate the AI takeover response
    let controllerClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const response = await openai.chat.completions.create({
            model: "claude-haiku-4-5:online/anthropic",
            max_tokens: 1000,
            temperature: 0.7,
            messages: messages,
            stream: true,
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
          let hasReceivedContent = false;
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

          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            const delta = chunk.choices[0]?.delta as { annotations?: Array<{ type: string; url_citation?: { url: string; title?: string } }> };
            const annotations = delta?.annotations;

            // Process annotations (citations from web search)
            if (annotations && Array.isArray(annotations)) {
              if (!hasReceivedContent && !searchIndicatorSent) {
                searchIndicatorSent = true;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "search_start",
                    })}\n\n`
                  )
                );
              }

              for (const annotation of annotations) {
                if (
                  annotation.type === "url_citation" &&
                  annotation.url_citation
                ) {
                  const urlCitation = annotation.url_citation;
                  const existingCitation = citations.find(
                    (c) => c.url === urlCitation.url
                  );

                  if (!existingCitation) {
                    const citationData = {
                      id: citationCounter++,
                      url: urlCitation.url,
                      title:
                        urlCitation.title || new URL(urlCitation.url).hostname,
                    };
                    citations.push(citationData);
                  }
                }
              }

              if (citations.length > 0 && !controllerClosed) {
                if (buffer) {
                  flushBuffer();
                }
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "citations",
                      citations: citations,
                    })}\n\n`
                  )
                );
              }
            }

            if (content) {
              hasReceivedContent = true;

              for (const char of content) {
                buffer += char;
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

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    // Handle validation errors from validateBody
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("AI takeover error:", error);
    return errors.internal("Failed to process AI takeover");
  }
}
