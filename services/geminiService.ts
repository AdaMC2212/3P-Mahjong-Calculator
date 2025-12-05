import { GoogleGenAI } from "@google/genai";
import { HandAnalysis } from "../types";

export const analyzeHandImage = async (base64Image: string): Promise<HandAnalysis> => {
  // Ensure the API Key is available
  if (!process.env.API_KEY) {
    console.warn("API_KEY is not set in process.env");
    return {
        fan: 5,
        feiCount: 0,
        kongCount: 0,
        reason: "API Key missing. Please configure environment variables.",
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
