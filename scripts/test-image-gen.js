const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDwjkjK0bkaEE12tC79GFsWEruFAyAYPMw";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function generateSingleImage() {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation",
    generationConfig: {
      responseModalities: ["Text", "Image"]
    }
  });

  const prompt = "Abstract digital art representing AI debate and critical thinking. A glowing neural network forming a conversation between human and AI silhouettes. Deep blue and purple gradient with electric accents, modern minimalist style.";

  try {
    console.log("Generating image...");
    const response = await model.generateContent(prompt);
    
    for (const part of response.response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, 'base64');
        const outputPath = path.join(__dirname, "..", "public", "blog", "test-hero.png");
        
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, buffer);
        console.log(`✓ Image saved to: ${outputPath}`);
        console.log(`  Size: ${(buffer.length / 1024).toFixed(2)} KB`);
        return true;
      }
    }
    console.error("No image data in response");
    return false;
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
}

generateSingleImage();
