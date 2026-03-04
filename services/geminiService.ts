import { GoogleGenAI } from "@google/genai";
import { HandAnalysis, SeatWind, TileExtractionResult, VisionWinType } from "../types";
import { calculateHandAnalysisFromExtraction, getRulesVersion } from "./mahjongRules";

const MODEL_NAME = "gemini-2.5-flash";
const CACHE_PREFIX = "mahjong-ai-cache-v1";
const APP_VERSION = "deterministic-ai-v1";
const LOW_CONFIDENCE_THRESHOLD = 0.78;
const REQUEST_THROTTLE_MS = 800;

let lastRequestTs = 0;

const getApiKey = (): string | undefined => {
  try {
    // @ts-ignore
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch {
    // ignore
  }

  if (typeof process !== "undefined" && process.env) {
    if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
    if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    if (process.env.API_KEY) return process.env.API_KEY;
  }

  return undefined;
};

const deterministicAiEnabled = (): boolean => {
  try {
    // @ts-ignore
    return import.meta?.env?.VITE_DETERMINISTIC_AI_SCORING !== "false";
  } catch {
    return true;
  }
};

const isSeatWind = (value: unknown): value is SeatWind =>
  value === "East" || value === "South" || value === "West";

const isWinType = (value: unknown): value is VisionWinType => value === "Zimo" || value === "Ron";

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

const normalizeMelds = (value: unknown): string[][] => {
  if (!Array.isArray(value)) return [];
  return value.map((meld) => toStringArray(meld)).filter((meld) => meld.length > 0);
};

const emptySeat = () => ({ concealed: [] as string[], exposedMelds: [] as string[][], flowers: [] as string[] });

const fallbackExtraction = (): TileExtractionResult => ({
  seats: {
    East: emptySeat(),
    South: emptySeat(),
    West: emptySeat(),
  },
  winnerSeat: "East",
  winType: "Zimo",
  discarderSeat: null,
  feiCount: 0,
  selfKongCount: 0,
  seatConfidence: { East: 0.4, South: 0.4, West: 0.4 },
  suggestedPatterns: [],
  confidenceScore: 0.4,
  notes: "Fallback extraction used.",
});

const fallbackAnalysis = (reason: string): HandAnalysis => {
  const extraction = fallbackExtraction();
  const analysis = calculateHandAnalysisFromExtraction(extraction, "gemini");
  return {
    ...analysis,
    lowConfidenceReasons: [...analysis.lowConfidenceReasons, reason],
    confidenceScore: 0.4,
    reason,
  };
};

const stripJsonFences = (text: string): string => text.replace(/^```json\s*|```$/gim, "").trim();

const normalizeExtraction = (raw: unknown): TileExtractionResult => {
  const data = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  const normalizedSeats: TileExtractionResult["seats"] = {
    East: emptySeat(),
    South: emptySeat(),
    West: emptySeat(),
  };

  const seatsRaw = (typeof data.seats === "object" && data.seats !== null ? data.seats : {}) as Record<string, unknown>;
  for (const seat of ["East", "South", "West"] as const) {
    const seatRaw = (typeof seatsRaw[seat] === "object" && seatsRaw[seat] !== null
      ? seatsRaw[seat]
      : {}) as Record<string, unknown>;
    normalizedSeats[seat] = {
      concealed: toStringArray(seatRaw.concealed),
      exposedMelds: normalizeMelds(seatRaw.exposedMelds),
      flowers: toStringArray(seatRaw.flowers),
    };
  }

  const winnerSeat = isSeatWind(data.winnerSeat) ? data.winnerSeat : "East";
  const winType: VisionWinType = isWinType(data.winType) ? data.winType : "Zimo";
  let discarderSeat = isSeatWind(data.discarderSeat) ? data.discarderSeat : null;
  if (winType === "Zimo") discarderSeat = null;
  if (winType === "Ron" && (!discarderSeat || discarderSeat === winnerSeat)) {
    discarderSeat = winnerSeat === "East" ? "South" : "East";
  }

  const seatConfidenceRaw =
    typeof data.seatConfidence === "object" && data.seatConfidence !== null
      ? (data.seatConfidence as Record<string, unknown>)
      : {};

  const seatConfidence: Record<SeatWind, number> = {
    East: Math.min(1, Math.max(0, toNumber(seatConfidenceRaw.East, 0.7))),
    South: Math.min(1, Math.max(0, toNumber(seatConfidenceRaw.South, 0.7))),
    West: Math.min(1, Math.max(0, toNumber(seatConfidenceRaw.West, 0.7))),
  };

  const confidenceScore = Math.min(
    1,
    Math.max(
      0,
      toNumber(data.confidenceScore, (seatConfidence.East + seatConfidence.South + seatConfidence.West) / 3)
    )
  );

  return {
    seats: normalizedSeats,
    winnerSeat,
    winType,
    discarderSeat,
    feiCount: Math.max(0, toNumber(data.feiCount, 0)),
    selfKongCount: Math.max(0, toNumber(data.selfKongCount, 0)),
    seatConfidence,
    suggestedPatterns: toStringArray(data.suggestedPatterns),
    confidenceScore,
    notes: typeof data.notes === "string" ? data.notes : undefined,
  };
};

const extractionPrompt = `You are a computer-vision extraction engine for real-life 3-player Mahjong.
Return only tile extraction JSON. Do NOT calculate fan, do NOT output payouts.

Output strict JSON with this exact shape and keys:
{
  "seats": {
    "East": { "concealed": ["dot_1"], "exposedMelds": [["dot_3","dot_4","dot_5"]], "flowers": ["flower_1"] },
    "South": { "concealed": [], "exposedMelds": [], "flowers": [] },
    "West": { "concealed": [], "exposedMelds": [], "flowers": [] }
  },
  "winnerSeat": "East",
  "winType": "Zimo",
  "discarderSeat": null,
  "feiCount": 0,
  "selfKongCount": 0,
  "seatConfidence": { "East": 0.9, "South": 0.8, "West": 0.8 },
  "suggestedPatterns": ["Ping Hu"],
  "confidenceScore": 0.85,
  "notes": "optional short note"
}

Tile IDs:
- Dots: dot_1 ... dot_9
- Winds: wind_east, wind_south, wind_west, wind_north
- Dragons: dragon_red, dragon_green, dragon_white
- Fei wildcard: fei
- Flowers/animals/faces: flower_1 ... flower_16

Constraints:
- winnerSeat and discarderSeat only East/South/West
- discarderSeat null when winType is Zimo
- discarderSeat required and not equal winnerSeat when winType is Ron
- confidence scores are 0..1
- return JSON only`;

const waitForThrottle = async () => {
  const now = Date.now();
  const waitMs = Math.max(0, REQUEST_THROTTLE_MS - (now - lastRequestTs));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastRequestTs = Date.now();
};

const callGeminiExtraction = async (ai: GoogleGenAI, base64Data: string): Promise<TileExtractionResult> => {
  await waitForThrottle();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        },
        { text: extractionPrompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      temperature: 0,
      topP: 0.1,
      candidateCount: 1,
    },
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("Empty extraction response from AI.");
  return normalizeExtraction(JSON.parse(stripJsonFences(jsonText)));
};

const stableSignature = (ext: TileExtractionResult): string => {
  const payload = {
    winnerSeat: ext.winnerSeat,
    winType: ext.winType,
    discarderSeat: ext.discarderSeat,
    feiCount: ext.feiCount,
    selfKongCount: ext.selfKongCount,
    suggestedPatterns: [...ext.suggestedPatterns].sort(),
    seats: {
      East: {
        concealed: [...ext.seats.East.concealed].sort(),
        flowers: [...ext.seats.East.flowers].sort(),
        exposedMelds: ext.seats.East.exposedMelds.map((m) => [...m].sort()).sort(),
      },
      South: {
        concealed: [...ext.seats.South.concealed].sort(),
        flowers: [...ext.seats.South.flowers].sort(),
        exposedMelds: ext.seats.South.exposedMelds.map((m) => [...m].sort()).sort(),
      },
      West: {
        concealed: [...ext.seats.West.concealed].sort(),
        flowers: [...ext.seats.West.flowers].sort(),
        exposedMelds: ext.seats.West.exposedMelds.map((m) => [...m].sort()).sort(),
      },
    },
  };
  return JSON.stringify(payload);
};

const chooseBestExtraction = (extractions: TileExtractionResult[]): { result: TileExtractionResult; usedVoting: boolean } => {
  if (extractions.length <= 1) {
    return { result: extractions[0], usedVoting: false };
  }

  const votes = new Map<string, { count: number; extraction: TileExtractionResult }>();
  for (const ext of extractions) {
    const sig = stableSignature(ext);
    const current = votes.get(sig);
    if (current) {
      current.count += 1;
    } else {
      votes.set(sig, { count: 1, extraction: ext });
    }
  }

  let best: { count: number; extraction: TileExtractionResult } | null = null;
  for (const value of votes.values()) {
    if (!best || value.count > best.count) {
      best = value;
      continue;
    }
    if (best && value.count === best.count && value.extraction.confidenceScore > best.extraction.confidenceScore) {
      best = value;
    }
  }

  return { result: best ? best.extraction : extractions[0], usedVoting: true };
};

const base64ToBytes = (base64Data: string): Uint8Array => {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const sha256Hex = async (base64Data: string): Promise<string> => {
  const bytes = base64ToBytes(base64Data);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const getCacheKey = (hash: string) => `${CACHE_PREFIX}:${MODEL_NAME}:${getRulesVersion()}:${APP_VERSION}:${hash}`;

const readCache = (cacheKey: string): HandAnalysis | null => {
  try {
    const text = localStorage.getItem(cacheKey);
    if (!text) return null;
    const parsed = JSON.parse(text) as HandAnalysis;
    return { ...parsed, source: "cache" };
  } catch {
    return null;
  }
};

const writeCache = (cacheKey: string, analysis: HandAnalysis): void => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(analysis));
  } catch {
    // ignore storage write failures
  }
};

const cleanBase64 = (base64Image: string): string =>
  base64Image.includes("base64,") ? base64Image.split("base64,")[1] : base64Image;

export const analyzeHandImage = async (base64Image: string): Promise<HandAnalysis> => {
  if (!deterministicAiEnabled()) {
    return fallbackAnalysis("Deterministic scoring is disabled by feature flag.");
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("API key missing. Checked VITE_API_KEY, REACT_APP_API_KEY, and API_KEY.");
    return fallbackAnalysis(
      "API key missing. Set VITE_API_KEY in Vercel Environment Variables and redeploy."
    );
  }

  const base64Data = cleanBase64(base64Image);

  try {
    const imageHash = await sha256Hex(base64Data);
    const cacheKey = getCacheKey(imageHash);
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const ai = new GoogleGenAI({ apiKey });
    const first = await callGeminiExtraction(ai, base64Data);
    const candidates: TileExtractionResult[] = [first];

    if (first.confidenceScore < LOW_CONFIDENCE_THRESHOLD) {
      const second = await callGeminiExtraction(ai, base64Data);
      const third = await callGeminiExtraction(ai, base64Data);
      candidates.push(second, third);
    }

    const { result: bestExtraction, usedVoting } = chooseBestExtraction(candidates);
    const analysis = calculateHandAnalysisFromExtraction(bestExtraction, usedVoting ? "voted" : "gemini");

    if (usedVoting && analysis.confidenceScore < LOW_CONFIDENCE_THRESHOLD) {
      analysis.lowConfidenceReasons = [
        ...analysis.lowConfidenceReasons,
        "Manual review required: extraction remained unstable after verification votes.",
      ];
    }

    writeCache(cacheKey, analysis);
    return analysis;
  } catch (error) {
    console.error("Gemini deterministic analysis error:", error);
    return fallbackAnalysis("AI extraction failed. Please verify scores manually.");
  }
};
