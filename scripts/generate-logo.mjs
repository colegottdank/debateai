import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not set");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" });

// Logo icon prompt - modern, minimalist, debate theme
const logoPrompt = `Create a modern, minimalist logo icon for "DebateAI" - an AI-powered debate platform.

Design requirements:
- A stylized speech bubble or dialogue icon combined with AI/neural network elements
- Clean geometric shapes, flat design
- Color palette: Deep purple/violet primary (#6b46c1) with subtle gradients
- The icon should represent "intelligent conversation" or "AI dialogue"
- Transparent or solid dark background that works on both light and dark themes
- Professional, trustworthy, innovative feel
- Simple enough to work at small sizes (favicon) and large (OG image)

No text in the icon itself - this is just the symbol/marks.`;

async function generateLogo() {
  try {
    console.log("Generating DebateAI logo...");
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: logoPrompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });
    
    const response = await result.response;
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        const outputPath = path.join(process.cwd(), "public", "logo-icon.png");
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Logo saved to ${outputPath} (${buffer.length} bytes)`);
        return;
      }
    }
    
    console.error("No image data received");
    process.exit(1);
  } catch (error) {
    console.error("Error generating logo:", error.message);
    process.exit(1);
  }
}

generateLogo();
