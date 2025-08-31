import OpenAI from "openai";
import { getHeliconeHeaders } from "./helicone";
import { searchForContext, shouldSearchForTopic } from "./search";
import { OpponentType } from "./opponents";
import { OPPONENT_PROMPTS, buildDebatePrompt } from "./debate-prompts";

export type Character = OpponentType;


export async function generateDebateResponseStream(
  character: Character,
  topic: string,
  userArgument: string,
  previousMessages: Array<{ role: string; content: string }>,
  userId?: string,
  debateId?: string,
  isPremium: boolean = false
) {
  const systemPrompt = OPPONENT_PROMPTS[character];

  // Get search context if topic is current events related
  let searchContext = "";
  if (shouldSearchForTopic(topic)) {
    searchContext = await searchForContext(topic + " " + userArgument);
  }

  // Get recent AI responses to avoid repetition
  const recentAIMessages = previousMessages
    .filter((m) => m.role === "ai")
    .slice(-2)
    .map((m) => m.content)
    .join(" ");

  const turnNumber =
    Math.floor(previousMessages.filter((m) => m.role === "user").length) + 1;

  // Build context-aware prompt
  const contextualPrompt = buildDebatePrompt(
    character,
    topic,
    userArgument,
    turnNumber,
    searchContext,
    recentAIMessages
  );

  // Create OpenRouter client with Helicone headers
  const openrouter = new OpenAI({
    baseURL: "https://openrouter.helicone.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    defaultHeaders: {
      ...getHeliconeHeaders(userId, isPremium, {
        character,
        topic,
        debateId,
        turnNumber,
      }),
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL || "https://debateai.com",
      "X-Title": "DebateAI",
    },
  });

  return openrouter.chat.completions.create({
    model: "meta-llama/llama-3.3-8b-instruct:free", // FREE and fast!
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: contextualPrompt,
      },
    ],
    max_tokens: 120,
    temperature: 0.8,
    stream: true,
  });
}

// Non-streaming version for fallback
export async function generateDebateResponse(
  character: Character,
  topic: string,
  userArgument: string,
  previousMessages: Array<{ role: string; content: string }>,
  userId?: string,
  debateId?: string,
  isPremium: boolean = false
) {
  const systemPrompt = OPPONENT_PROMPTS[character];

  // Create OpenRouter client with Helicone headers
  const openrouter = new OpenAI({
    baseURL: "https://openrouter.helicone.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    defaultHeaders: {
      ...getHeliconeHeaders(userId, isPremium, {
        character,
        topic,
        debateId,
      }),
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL || "https://debateai.com",
      "X-Title": "DebateAI",
    },
  });

  const response = await openrouter.chat.completions.create({
    model: "meta-llama/llama-3.3-8b-instruct:free", // FREE and fast!
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: buildDebatePrompt(character, topic, userArgument, 1),
      },
    ],
    max_tokens: 150,
    temperature: 0.8,
  });

  return response.choices[0]?.message?.content || "";
}
