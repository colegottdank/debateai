import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { d1 } from "@/lib/d1";
import { auth } from "@clerk/nextjs/server";
import { getHeliconeHeaders } from "@/lib/helicone";

// Note: We create OpenRouter clients per-request with user-specific headers now

const SCORING_PROMPT = `You are a South Park-style debate judge. Score this debate between a human and a South Park character.

SCORING RUBRIC:
- Humor & Savagery (0-30): How funny and brutal are the burns?
- South Park References (0-20): Use of show references, character voice, catchphrases
- Debate Logic (0-20): Actual argument quality (but ridiculous logic is fine if funny)
- Aggression & Confidence (0-20): How assertive and dominant
- Creativity (0-10): Unique insults and unexpected comebacks

AI CHARACTER ADVANTAGE: The South Park character should almost always win (they're master debaters). Give them a 1.5x score multiplier.

RESPONSE FORMAT (JSON):
{
  "userScore": <total user score>,
  "aiScore": <total AI score with multiplier>,
  "bestBurn": "<exact quote of the most savage burn>",
  "bestBurnBy": "user" or "ai",
  "analysis": "<brief explanation of scoring>"
}`;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const { messages, characterName, debateId } = await request.json();

  try {
    if (!messages || !characterName || !debateId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if debate already has a score
    const existingDebate = await d1.getDebate(debateId);
    if (existingDebate.success && existingDebate.debate?.score_data) {
      console.log("Returning cached score for debate:", debateId);
      return NextResponse.json(existingDebate.debate.score_data);
    }

    // Format debate for AI analysis
    const debateTranscript = messages
      .filter(
        (m: { role: string; content: string }) =>
          m.role === "user" || m.role === "ai" || m.role === "assistant"
      )
      .map((m: { role: string; content: string }) => {
        const speaker =
          m.role === "user" ? "HUMAN" : characterName.toUpperCase();
        return `${speaker}: ${m.content}`;
      })
      .join("\n\n");

    // Check if user is premium
    const user = userId ? await d1.getUser(userId) : null;
    const isPremium = user?.subscription_status === 'active';

    // Create client with custom headers for scoring
    const scoringClient = new OpenAI({
      baseURL: "https://openrouter.helicone.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY || "",
      defaultHeaders: {
        ...getHeliconeHeaders(userId || undefined, isPremium, {
          character: characterName,
          debateId,
          purpose: "scoring",
        }),
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://masterdebater.ai",
        "X-Title": "MasterDebater.ai",
      },
    });

    // Use free Gemini 2.0 Flash model for scoring
    const response = await scoringClient.chat.completions.create({
      model: "google/gemini-2.0-flash-exp:free",
      messages: [
        {
          role: "system",
          content: SCORING_PROMPT,
        },
        {
          role: "user",
          content: `Score this debate:\n\n${debateTranscript}\n\nCharacter: ${characterName}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent scoring
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    // Count rounds
    const userMessages = messages.filter(
      (m: { role: string; content: string }) => m.role === "user"
    );
    const aiMessages = messages.filter(
      (m: { role: string; content: string }) =>
        m.role === "ai" || m.role === "assistant"
    );
    const totalRounds = Math.min(userMessages.length, aiMessages.length);

    // Determine verdict and roast level
    const scoreDiff = result.aiScore - result.userScore;
    let verdict: string;
    let roastLevel: "destroyed" | "roasted" | "held_own" | "dominated";

    if (scoreDiff > 50) {
      verdict = "Got COMPLETELY DESTROYED";
      roastLevel = "destroyed";
    } else if (scoreDiff > 25) {
      verdict = "Got roasted hard";
      roastLevel = "roasted";
    } else if (scoreDiff > 0) {
      verdict = "Put up a decent fight";
      roastLevel = "held_own";
    } else {
      verdict = "Actually won?! (Cartman demands rematch)";
      roastLevel = "dominated";
    }

    const scoreData = {
      userScore: Math.round(result.userScore || 0),
      aiScore: Math.round(result.aiScore || 0),
      totalRounds,
      bestBurn: result.bestBurn || "No good burns detected",
      bestBurnBy: result.bestBurnBy || "ai",
      survivedRounds: totalRounds,
      verdict,
      roastLevel,
    };

    // Save the score to the database if we have a user ID
    if (userId && debateId) {
      // CRITICAL: Fetch existing debate data first to preserve messages/topic
      const existingDebateResponse = await d1.getDebate(debateId);
      if (existingDebateResponse.success && existingDebateResponse.debate) {
        const existingDebate = existingDebateResponse.debate;

        await d1.saveDebate({
          userId,
          debateId,
          character:
            (existingDebate.character as string) || characterName.toLowerCase(),
          topic: (existingDebate.topic as string) || "",
          messages:
            (existingDebate.messages as Array<{
              role: string;
              content: string;
            }>) || [],
          userScore: scoreData.userScore,
          aiScore: scoreData.aiScore,
          scoreData,
        });
      } else {
        console.warn(
          "Could not fetch existing debate data for scoring, skipping save to prevent data loss"
        );
      }
    }

    return NextResponse.json(scoreData);
  } catch (error) {
    console.error("AI scoring failed:", error);

    // Fallback scoring if AI fails (body was already read, so use the variables from above)
    const userMessages = messages.filter(
      (m: { role: string; content: string }) => m.role === "user"
    );
    const aiMessages = messages.filter(
      (m: { role: string; content: string }) =>
        m.role === "ai" || m.role === "assistant"
    );
    const totalRounds = Math.min(userMessages.length, aiMessages.length);

    // Simple scoring: AI always wins with 3x user score
    const userScore = 10 + totalRounds * 5;
    const aiScore = userScore * 3;

    // Extract a random AI message as best burn
    const randomAiMessage =
      aiMessages[Math.floor(Math.random() * aiMessages.length)];
    const bestBurn =
      randomAiMessage?.content.split(".")[0] || "You got destroyed!";

    const fallbackScore = {
      userScore,
      aiScore,
      totalRounds,
      bestBurn,
      bestBurnBy: "ai",
      survivedRounds: totalRounds,
      verdict: "Got roasted hard",
      roastLevel: "roasted" as const,
    };

    // Save fallback score to database if we have a user ID
    if (userId && debateId) {
      // CRITICAL: Fetch existing debate data first to preserve messages/topic
      const existingDebateResponse = await d1.getDebate(debateId);
      if (existingDebateResponse.success && existingDebateResponse.debate) {
        const existingDebate = existingDebateResponse.debate;

        await d1.saveDebate({
          userId,
          debateId,
          character:
            (existingDebate.character as string) || characterName.toLowerCase(),
          topic: (existingDebate.topic as string) || "",
          messages:
            (existingDebate.messages as Array<{
              role: string;
              content: string;
            }>) || [],
          userScore: fallbackScore.userScore,
          aiScore: fallbackScore.aiScore,
          scoreData: fallbackScore,
        });
      } else {
        console.warn(
          "Could not fetch existing debate data for fallback scoring, skipping save to prevent data loss"
        );
      }
    }

    return NextResponse.json(fallbackScore);
  }
}
