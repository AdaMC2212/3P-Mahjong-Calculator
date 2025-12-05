import { GoogleGenAI, Type } from "@google/genai";
import { HandAnalysis } from "../types";

// Note: In a real production app, this key should be proxied through a backend.
// For this client-side demo, we use the env variable directly as instructed.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeHandImage = async (base64Image: string): Promise<HandAnalysis> => {
  const modelId = "gemini-2.5-flash";

  const prompt = `
    You are an expert at scoring Malaysia 3-Player Mahjong. 
    Analyze the mahjong tiles in this image.
    
    Specific Rules for Malaysia 3-Player Mahjong:
    1. Suits: Only Dot (Tong) suit exists, plus Honors (Winds: East, South, West, North; Dragons: Red, Green, White).
    2. Jokers (Fei): Usually captured as a specific sticker or generic looking tile on top of others, or specific 'Fly' tiles. Count them if clearly visible.
    3. Kongs: 4 identical tiles.
    
    Your task:
    1. Identify the tiles.
    2. Estimate the 'Fan' (points) count based on standard Malaysian 3-player patterns (e.g., Ping Hu, Dui Dui Hu, Qing Yi Se, Hun Yi Se).
    3. Count 'Fei' (Jokers) and 'Kongs'.
    4. Provide a very brief reason for the Fan count.
    
    Return JSON format only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(",")[1], // Remove data:image/jpeg;base64, prefix
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fan: { type: Type.INTEGER, description: "Estimated Fan count" },
            feiCount: { type: Type.INTEGER, description: "Number of Joker/Fei tiles detected" },
            kongCount: { type: Type.INTEGER, description: "Number of Kongs detected" },
            reason: { type: Type.STRING, description: "Short explanation of the score" },
          },
          required: ["fan", "feiCount", "kongCount", "reason"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as HandAnalysis;
    }
    
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback in case of error
    return {
      fan: 0,
      feiCount: 0,
      kongCount: 0,
      reason: "Could not analyze image. Please input manually.",
    };
  }
};
