const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Checking API Key...", apiKey ? "Present" : "Missing");

  if (!apiKey) {
    console.error("Please set GEMINI_API_KEY in your .env file");
    return;
  }

  try {
    // Using fetch to call the REST API directly to list models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log("\n=== AVAILABLE MODELS ===");
    data.models.forEach(model => {
      // Filter for models that support content generation
      if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
        console.log(`Model: ${model.name}`);
        console.log(`Methods: ${model.supportedGenerationMethods.join(", ")}`);
        console.log("---");
      }
    });

  } catch (error) {
    console.error("Failed to list models:", error.message);
  }
}

listModels();