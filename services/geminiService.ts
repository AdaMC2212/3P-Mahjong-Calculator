import { GoogleGenAI } from "@google/genai";
import { HandAnalysis } from "../types";

// Helper to safely get the API key from various environment configurations
const getApiKey = (): string | undefined => {
  // 1. Try Vite (most likely for this project structure)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore error if import.meta is not supported
  }

  // 2. Try Standard Process (Webpack/CRA/Node)
  if (typeof process !== 'undefined' && process.env) {
    // Check for standard frontend prefixes
    if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
    if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    // Fallback for some custom setups
    if (process.env.API_KEY) return process.env.API_KEY;
  }

  return undefined;
};

export const analyzeHandImage = async (base64Image: string): Promise<HandAnalysis> => {
  const apiKey = getApiKey();

  // Ensure the API Key is available
  if (!apiKey) {
    console.warn("API Key missing. Checked VITE_API_KEY, REACT_APP_API_KEY, and API_KEY.");
    return {
        fan: 5,
        feiCount: 0,
        kongCount: 0,
        reason: "Error: API Key missing. In Vercel Settings > Environment Variables, create a key named 'VITE_API_KEY' (not just API_KEY) and paste your Google API key. Then redeploy.",
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  // Clean the base64 string (remove data URL prefix if present)
  const base64Data = base64Image.includes('base64,') 
    ? base64Image.split('base64,')[1] 
    : base64Image;

  const prompt = `You are an expert scoring assistant for Malaysia 3-Player Mahjong.
  Analyze the provided image of a winning mahjong hand.
  
  1. Identify the tiles present.
  2. Calculate the "Fan" (points) based on Malaysia 3-Player rules.
     - Common scoring patterns: Ping Hu, Dui Dui Hu, Qing Yi Se (Half Flush), Hun Yi Se (Full Flush), etc.
     - Flower/Season tiles count as Fan.
     - Min Fan for winning is usually 5, but calculate the actual value seen.
  3. Count visible "Fei" (Flying/Joker) tiles.
  4. Count visible "Kongs" (4 identical tiles).

  Return ONLY a raw JSON object with this exact structure (no markdown formatting):
  {
    "fan": number,
    "feiCount": number,
    "kongCount": number,
    "reason": "A brief, one-sentence explanation of the hand pattern found."
  }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    const result = JSON.parse(jsonText) as HandAnalysis;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      fan: 5, // Default safe value
      feiCount: 0,
      kongCount: 0,
      reason: "AI analysis failed. Please verify scores manually.",
    };
  }
};
