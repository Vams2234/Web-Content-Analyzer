const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

// Initialize Gemini
// Make sure GEMINI_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use 'gemini-3-flash-preview' based on your available models
const model = genAI.getGenerativeModel({ 
  model: "gemini-3-flash-preview",
  generationConfig: { responseMimeType: "application/json" },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
});

// Helper to clean JSON output from LLM (removes markdown code blocks)
const cleanJson = (text) => {
  try {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstOpen = cleaned.indexOf('{');
    const lastClose = cleaned.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) cleaned = cleaned.substring(firstOpen, lastClose + 1);
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini response:", text);
    return null;
  }
};

const analyzeAll = async (scrapedData) => {
  try {
    const text = scrapedData.rawText || '';
    const prompt = `
      Perform a comprehensive analysis of this website content.
      Title: ${scrapedData.title}
      URL: ${scrapedData.url}
      Content: ${text.substring(0, 15000)}

      Output ONLY valid JSON with the following structure:
      {
        "executiveSummary": "Brief summary (max 3 sentences)",
        "seoAnalysis": {
          "score": 0-100, // Integer
          "recommendations": ["rec1", "rec2", "rec3"]
        },
        "targetAudience": "Description of target audience",
        "keyTopics": ["topic1", "topic2", "topic3"],
        "sentiment": {
          "overallSentiment": "Positive" | "Negative" | "Neutral",
          "confidenceLevel": 0.0-1.0,
          "sentimentScores": {
            "positive": 0-100,
            "negative": 0-100,
            "neutral": 0-100
          }
        },
        "keywords": [
          {"word": "example", "frequency": 5} // Top 10 keywords
        ],
        "categoryData": {
          "category": "Technology" | "Health" | "Finance" | "Business" | "Other", // Primary category
          "tags": ["tag1", "tag2"]
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const json = cleanJson(response.text());

    if (!json) throw new Error("Failed to parse JSON from Gemini");

    // Structure the return to match what the worker expects
    return {
      ...json,
      keywords: { keywords: json.keywords || [] } // Wrap array to match previous structure
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error.message);
    // Return safe fallback
    return {
      executiveSummary: "Analysis failed to generate.",
      seoAnalysis: { score: 0, recommendations: [] },
      targetAudience: "Unknown",
      keyTopics: [],
      sentiment: { overallSentiment: "Neutral", confidenceLevel: 0, sentimentScores: {} },
      keywords: { keywords: [] },
      categoryData: { category: "Uncategorized", tags: [] }
    };
  }
};

module.exports = {
  analyzeAll
};