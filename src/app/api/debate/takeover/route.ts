import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserId } from "@/lib/auth-helper";
import { d1 } from "@/lib/d1";
import { checkAppDisabled } from "@/lib/app-disabled";
import { getTakeoverPrompt } from "@/lib/prompts";

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
    const isLocalDev =
      process.env.NODE_ENV === "development" ||
      process.env.LOCAL_DEV_BYPASS === "true";
    if (!isTestMode && !isLocalDev) {
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
    const systemPrompt = getTakeoverPrompt(
      topic,
      opponentStyle,
      conversationHistory,
      userArguments
    );

    const lastOpponentMessage =
      (previousMessages || []).filter((msg: any) => msg.role === "ai").pop()
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
    // eslint-disable-next-line prefer-const
    let controllerClosed = false; // Track if controller is closed

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const response = await openai.chat.completions.create({
            model: "claude-sonnet-4:online/anthropic",
            max_tokens: 600, // Strictly enforce brevity for takeover
            temperature: 0.7,
            messages: messages,
            stream: true,
          });

          let buffer = "";
          let accumulatedContent = "";
          let lastFlushTime = Date.now();
          const BUFFER_TIME = 50; // Slower for more human-like streaming
          const BUFFER_SIZE = 5; // Smaller chunks for smoother flow
          const citations: any[] = [];
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
            // Log EVERY single chunk from Helicone to see full structure
            console.log(
              "📚 [TAKEOVER - FULL CHUNK FROM HELICONE]:",
              JSON.stringify(chunk, null, 2)
            );

            const content = chunk.choices[0]?.delta?.content;
            const delta = chunk.choices[0]?.delta as any;
            const annotations = delta?.annotations;

            // Process annotations (citations from web search)
            if (annotations && Array.isArray(annotations)) {
              // If we have annotations but no content yet, web search is happening
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

                  // Check if we already have this citation (deduplicate by URL)
                  const existingCitation = citations.find(
                    (c) => c.url === urlCitation.url
                  );

                  if (!existingCitation) {
                    // Create new citation
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

              // Send citations update to frontend
              if (citations.length > 0 && !controllerClosed) {
                // Flush any pending content first
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
