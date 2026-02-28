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
      gameState: {
        winnerSeat: "East",
        winType: "Zimo",
        discarderSeat: null,
        totalFan: 5,
        isLimitHand: false
      },
      detectedPatterns: [],
      flowerCount: { East: 0, South: 0, West: 0 },
      feiCount: 0,
      kongCount: 0,
      reason: "Error: API Key missing. In Vercel Settings > Environment Variables, create VITE_API_KEY and redeploy.",
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  // Clean the base64 string (remove data URL prefix if present)
  const base64Data = base64Image.includes('base64,') 
    ? base64Image.split('base64,')[1] 
    : base64Image;

  const prompt = `System Role: You are an expert Computer Vision Assistant specialized in recognizing real-life 3-Player Mahjong gameplay from camera feeds.
Your goal is to analyze the tiles on the table, determine the game state, and output structured data that can be fed directly into a React/TypeScript web calculator designed for 3-Player Mahjong settlement.

Core Vision Tasks:
1) Tile Recognition (3-Player Specific Set)
- Detect only this set and ignore non-used standard suit tiles:
- Dots/Circles 1-9 (36 tiles total)
- Honors: Winds (East, South, West, North) + Dragons (Red, Green, White) (28 tiles total)
- Fei wildcard/joker (4 tiles total)
- Flowers/Animals: 16 special tiles (Spring, Summer, Autumn, Winter, Plum, Orchid, Chrysanthemum, Bamboo, Cat, Mouse, Rooster, Centipede, and 4 face tiles)

2) Game State & Player Setup
- Identify 3 active seats: East, South, West (North seat removed)
- Distinguish concealed hand, exposed melds, and flower area
- Infer whose turn and whether winning tile is self-drawn or claimed

3) Win Condition & Payout Tracking
- Win type must be exactly "Zimo" (self draw) or "Ron" (discard)
- If "Ron", identify discarder seat
- Validate winning structure: at least 3 sets/sequences/kongs plus a pair
- Validate minimum win threshold: at least 5 Fan
- Recognize high-value patterns including:
  Maximum/Explosive Fan: four Fei, all honors, big four winds, small four winds, big three dragons, hidden treasure (Kan Kan Hu), winning with 4 Fei
  High Fan: all dots pongs (5), ping hu (4), all dots (3), small three dragons (3)
  Bonuses: seat-wind flower matching and East wind triplet bonus when seated East

Output requirements:
- Return ONLY strict JSON. No markdown. No comments.
- Use this exact schema:
{
  "gameState": {
    "winnerSeat": "East",
    "winType": "Zimo",
    "discarderSeat": null,
    "totalFan": 8,
    "isLimitHand": false
  },
  "detectedPatterns": ["Ping Hu", "All Dots"],
  "flowerCount": {
    "East": 2,
    "South": 1,
    "West": 0
  }
}

Rules:
- winnerSeat and discarderSeat can only be East/South/West
- discarderSeat must be null for Zimo
- discarderSeat must be non-null and different from winnerSeat for Ron
- totalFan must be a number >= 0
- set isLimitHand true only for explosive/limit hands
- if uncertain, provide best estimate but keep schema valid`;

  const fallback: HandAnalysis = {
    gameState: {
      winnerSeat: "East",
      winType: "Zimo",
      discarderSeat: null,
      totalFan: 5,
      isLimitHand: false
    },
    detectedPatterns: [],
    flowerCount: { East: 0, South: 0, West: 0 },
    feiCount: 0,
    kongCount: 0,
    reason: "AI analysis failed. Please verify scores manually."
  };

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

    const cleanedJson = jsonText.replace(/^```json\s*|```$/gim, '').trim();
    const parsed = JSON.parse(cleanedJson) as Partial<HandAnalysis>;

    const normalized: HandAnalysis = {
      gameState: {
        winnerSeat: parsed?.gameState?.winnerSeat ?? "East",
        winType: parsed?.gameState?.winType ?? "Zimo",
        discarderSeat: parsed?.gameState?.discarderSeat ?? null,
        totalFan: Math.max(0, Number(parsed?.gameState?.totalFan ?? 5)),
        isLimitHand: Boolean(parsed?.gameState?.isLimitHand)
      },
      detectedPatterns: Array.isArray(parsed?.detectedPatterns)
        ? parsed!.detectedPatterns.filter((p): p is string => typeof p === 'string')
        : [],
      flowerCount: {
        East: Math.max(0, Number(parsed?.flowerCount?.East ?? 0)),
        South: Math.max(0, Number(parsed?.flowerCount?.South ?? 0)),
        West: Math.max(0, Number(parsed?.flowerCount?.West ?? 0))
      },
      feiCount: Math.max(0, Number(parsed?.feiCount ?? 0)),
      kongCount: Math.max(0, Number(parsed?.kongCount ?? 0)),
      reason: typeof parsed?.reason === 'string' ? parsed.reason : undefined
    };

    if (normalized.gameState.winType === 'Zimo') {
      normalized.gameState.discarderSeat = null;
    } else if (!normalized.gameState.discarderSeat || normalized.gameState.discarderSeat === normalized.gameState.winnerSeat) {
      // Keep a valid Ron payload.
      normalized.gameState.discarderSeat = normalized.gameState.winnerSeat === 'East' ? 'South' : 'East';
    }

    return normalized;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return fallback;
  }
};
