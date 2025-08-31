import Anthropic from "@anthropic-ai/sdk";
import { OpponentType } from "./opponents";
import { IMPROVED_PROMPTS, buildClaudeCodePrompt } from "./improved-prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface DebateStreamChunk {
  type: "text" | "searching" | "complete" | "error";
  content?: string;
  query?: string;
}

// Web search tool definition
const WEB_SEARCH_TOOL: Anthropic.Tool = {
  name: "web_search",
  description:
    "Search the web for current information to support arguments in the debate",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query",
      },
    },
    required: ["query"],
  },
};

export async function* streamDebateResponse(
  debateId: string,
  opponent: OpponentType,
  topic: string,
  userArgument: string,
  turnNumber: number,
  isFirstTurn: boolean,
  previousMessages?: Array<{ role: string; content: string }>
): AsyncGenerator<DebateStreamChunk> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set!");
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    
    const systemPrompt = IMPROVED_PROMPTS[opponent];

    // Build conversation history
    const messages: Anthropic.MessageParam[] = [];

    // Add previous messages if any (but skip system messages)
    if (previousMessages) {
      for (const msg of previousMessages) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
      }
    }

    // Add the current user argument
    messages.push({
      role: "user",
      content: `Topic: "${topic}"\n\nMy argument: ${userArgument}\n\nProvide a counterargument. Be concise (80-100 words max).`,
    });

    console.log(
      `Starting Anthropic debate for ${debateId}, turn ${turnNumber}`
    );
    console.log("System prompt:", systemPrompt);

    // Create the stream
    const stream = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514", // Use latest model
      max_tokens: 300, // Keep responses short
      temperature: 0.7,
      system: systemPrompt,
      messages,
      tools: [WEB_SEARCH_TOOL], // Enable web search for fact-checking
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      if (chunk.type === "content_block_start") {
        if (chunk.content_block.type === "tool_use") {
          // AI is using web search
          const toolName = chunk.content_block.name;
          if (toolName === "web_search") {
            yield { type: "searching", query: "Searching for facts..." };
          }
        }
      } else if (chunk.type === "content_block_delta") {
        if (chunk.delta.type === "text_delta") {
          // Stream text content
          const text = chunk.delta.text;
          fullResponse += text;
          yield { type: "text", content: text };
        } else if (chunk.delta.type === "input_json_delta") {
          // Tool input being constructed
          const partial = chunk.delta.partial_json;
          if (partial && partial.includes("query")) {
            // Extract query from partial JSON if possible
            try {
              const match = partial.match(/"query":\s*"([^"]+)"/);
              if (match) {
                yield { type: "searching", query: match[1] };
              }
            } catch (e) {
              // Ignore parsing errors for partial JSON
            }
          }
        }
      } else if (chunk.type === "message_stop") {
        // Message complete
        yield { type: "complete", content: fullResponse };
      }
    }
  } catch (error) {
    console.error("Error in Anthropic debate stream:", error);
    yield {
      type: "error",
      content:
        error instanceof Error
          ? error.message
          : "An error occurred during the debate",
    };
  }
}

// Helper function to convert stream to SSE format for API routes
export async function* debateStreamToSSE(
  debateId: string,
  opponent: OpponentType,
  topic: string,
  userArgument: string,
  turnNumber: number,
  isFirstTurn: boolean,
  previousMessages?: Array<{ role: string; content: string }>
): AsyncGenerator<string> {
  try {
    for await (const chunk of streamDebateResponse(
      debateId,
      opponent,
      topic,
      userArgument,
      turnNumber,
      isFirstTurn,
      previousMessages
    )) {
      if (chunk.type === "searching") {
        yield `data: ${JSON.stringify({
          type: "searching",
          query: chunk.query,
        })}\n\n`;
      } else if (chunk.type === "text") {
        yield `data: ${JSON.stringify({
          type: "chunk",
          content: chunk.content,
        })}\n\n`;
      } else if (chunk.type === "complete") {
        yield `data: ${JSON.stringify({
          type: "complete",
          content: chunk.content,
        })}\n\n`;
      } else if (chunk.type === "error") {
        yield `data: ${JSON.stringify({
          type: "error",
          content: chunk.content,
        })}\n\n`;
      }
    }

    yield "data: [DONE]\n\n";
  } catch (error) {
    console.error("Error in SSE stream:", error);
    yield `data: ${JSON.stringify({
      type: "error",
      content: "Stream error occurred",
    })}\n\n`;
    yield "data: [DONE]\n\n";
  }
}
