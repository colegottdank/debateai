import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { d1 } from "@/lib/d1";
import { characters } from "@/lib/characters";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const debateId = searchParams.get("debateId");

    // Fetch debate data if debateId provided
    let score: Record<string, unknown> | null = null;
    let characterName = "AI";
    let topic = "";

    if (debateId) {
      try {
        const result = await d1.getDebate(debateId);
        if (result.success && result.debate?.score_data) {
          score = result.debate.score_data as Record<string, unknown>;
          const character = characters.find(
            (c) => c.id === result.debate?.character
          );
          characterName =
            character?.name || (result.debate?.character as string) || "AI";
          topic = (result.debate.topic as string) || "Master Debate";
        }
      } catch (error) {
        console.error("OG: Failed to fetch debate data:", error);
      }
    }

    // If no score, return default image
    if (!score) {
      return new ImageResponse(
        (
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 60,
              fontWeight: "bold",
              color: "white",
            }}
          >
            <div style={{ marginBottom: 20 }}>🥊</div>
            <div>MasterDebater.ai</div>
            <div style={{ fontSize: 32, marginTop: 20, opacity: 0.8 }}>
              Challenge AI Debaters
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    // Get background gradient based on score
    const getBackground = () => {
      switch (score?.roastLevel as string) {
        case "destroyed":
          return "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)";
        case "roasted":
          return "linear-gradient(135deg, #EA580C 0%, #DC2626 100%)";
        case "held_own":
          return "linear-gradient(135deg, #EAB308 0%, #EA580C 100%)";
        case "dominated":
          return "linear-gradient(135deg, #16A34A 0%, #059669 100%)";
        default:
          return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      }
    };

    return new ImageResponse(
      (
        <div
          style={{
            background: getBackground(),
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
          }}
        >
          {/* Verdict */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              marginBottom: "30px",
              textShadow: "4px 4px 8px rgba(0, 0, 0, 0.4)",
            }}
          >
            {(score?.verdict as string)?.toUpperCase() || "DEBATE COMPLETED"}
          </div>

          {/* Scores */}
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#FDE047",
              marginBottom: "30px",
              textShadow: "4px 4px 12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {(score?.userScore as number) || 0} -{" "}
            {(score?.aiScore as number) || 0}
          </div>

          {/* Character */}
          <div
            style={{
              fontSize: 32,
              color: "white",
              marginBottom: "20px",
            }}
          >
            vs {characterName.toUpperCase()}
          </div>

          {/* Topic */}
          <div
            style={{
              fontSize: 20,
              color: "white",
              opacity: 0.8,
              marginBottom: "20px",
              display: topic ? "flex" : "none",
            }}
          >
            Topic: {topic}
          </div>

          {/* Branding */}
          <div
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "white",
              opacity: 0.9,
              marginTop: "40px",
            }}
          >
            MasterDebater.ai
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);

    // Return fallback image
    return new ImageResponse(
      (
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 60,
            fontWeight: "bold",
            color: "white",
          }}
        >
          <div>MasterDebater.ai</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
