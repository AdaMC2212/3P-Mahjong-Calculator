import { HandAnalysis, SeatWind, TileExtractionResult } from "../types";

const PATTERN_FAN: Record<string, number> = {
  "Ping Hu": 4,
  "All Dots": 3,
  "All Dots Pongs": 5,
  "Small Three Dragons": 3,
  "Big Three Dragons": 13,
  "Small Four Winds": 13,
  "Big Four Winds": 13,
  "All Honors": 13,
  "Kan Kan Hu": 13,
  "4 Fei": 13,
};

const LIMIT_PATTERNS = new Set([
  "Big Three Dragons",
  "Small Four Winds",
  "Big Four Winds",
  "All Honors",
  "Kan Kan Hu",
  "4 Fei",
]);

const RULES_VERSION = "rules-v1";

const toList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

const flattenSeatTiles = (seat: TileExtractionResult["seats"][SeatWind]) => {
  const meldTiles = seat.exposedMelds.flatMap((m) => m);
  return [...toList(seat.concealed), ...meldTiles];
};

const isHonorTile = (tile: string) =>
  tile.startsWith("wind_") || tile.startsWith("dragon_");

const isDotTile = (tile: string) => tile.startsWith("dot_");

const normalizePatternName = (name: string): string => {
  const n = name.trim().toLowerCase();
  if (!n) return "";
  if (n.includes("ping")) return "Ping Hu";
  if (n.includes("all dots pong")) return "All Dots Pongs";
  if (n.includes("all dots")) return "All Dots";
  if (n.includes("small three dragon")) return "Small Three Dragons";
  if (n.includes("big three dragon")) return "Big Three Dragons";
  if (n.includes("small four wind")) return "Small Four Winds";
  if (n.includes("big four wind")) return "Big Four Winds";
  if (n.includes("all honor")) return "All Honors";
  if (n.includes("kan kan")) return "Kan Kan Hu";
  if (n.includes("4 fei") || n.includes("four fei")) return "4 Fei";
  return name.trim();
};

const getFlowerSeatBonus = (winnerSeat: SeatWind, flowers: string[]): number => {
  const seatFlowerMap: Record<SeatWind, string[]> = {
    East: ["flower_1", "spring"],
    South: ["flower_2", "summer"],
    West: ["flower_3", "autumn"],
  };
  const tokens = seatFlowerMap[winnerSeat];
  return flowers.some((f) => tokens.some((t) => f.toLowerCase().includes(t))) ? 1 : 0;
};

const countTile = (tiles: string[], target: string) =>
  tiles.reduce((sum, t) => (t === target ? sum + 1 : sum), 0);

const inferPatterns = (input: TileExtractionResult): string[] => {
  const winnerSeat = input.winnerSeat;
  const winnerTiles = flattenSeatTiles(input.seats[winnerSeat]).map((t) => t.toLowerCase());
  const inferred = new Set<string>();

  if (input.feiCount >= 4) inferred.add("4 Fei");

  const allNonFlower = winnerTiles.filter((t) => !t.startsWith("flower_") && !t.includes("spring") && !t.includes("summer") && !t.includes("autumn") && !t.includes("winter"));
  if (allNonFlower.length > 0 && allNonFlower.every((t) => isHonorTile(t))) inferred.add("All Honors");
  if (allNonFlower.length > 0 && allNonFlower.every((t) => isDotTile(t))) inferred.add("All Dots");

  const exposed = input.seats[winnerSeat].exposedMelds;
  const pongLike =
    exposed.length > 0 &&
    exposed.every((meld) => meld.length >= 3 && meld.every((tile) => tile === meld[0]) && isDotTile(meld[0].toLowerCase()));
  if (pongLike && inferred.has("All Dots")) inferred.add("All Dots Pongs");

  if (countTile(winnerTiles, "wind_east") >= 3 && winnerSeat === "East") {
    inferred.add("East Wind Triplet Bonus");
  }

  for (const suggested of input.suggestedPatterns) {
    const normalized = normalizePatternName(suggested);
    if (normalized) inferred.add(normalized);
  }

  return Array.from(inferred);
};

const computeFan = (patterns: string[], input: TileExtractionResult): number => {
  let fan = 0;
  for (const p of patterns) fan += PATTERN_FAN[p] ?? 0;

  const winnerFlowers = toList(input.seats[input.winnerSeat].flowers).map((f) => f.toLowerCase());
  fan += getFlowerSeatBonus(input.winnerSeat, winnerFlowers);

  if (patterns.includes("East Wind Triplet Bonus")) fan += 2;

  return Math.max(5, fan);
};

const getLowConfidenceReasons = (input: TileExtractionResult, patterns: string[]): string[] => {
  const reasons: string[] = [];
  if (input.confidenceScore < 0.78) reasons.push("Low tile recognition confidence.");

  if (input.winType === "Ron" && !input.discarderSeat) {
    reasons.push("Discard winner detected without clear discarder seat.");
  }
  if (input.winType === "Ron" && input.discarderSeat === input.winnerSeat) {
    reasons.push("Discarder seat matched winner seat and was auto-corrected.");
  }
  if (patterns.length === 0) {
    reasons.push("No stable scoring pattern detected from extraction.");
  }
  return reasons;
};

export const getRulesVersion = () => RULES_VERSION;

export const calculateHandAnalysisFromExtraction = (
  input: TileExtractionResult,
  source: HandAnalysis["source"] = "gemini"
): HandAnalysis => {
  const patterns = inferPatterns(input);
  const totalFan = computeFan(patterns, input);
  const isLimitHand =
    input.feiCount >= 4 || patterns.some((pattern) => LIMIT_PATTERNS.has(pattern));

  const flowerCount: Record<SeatWind, number> = {
    East: toList(input.seats.East.flowers).length,
    South: toList(input.seats.South.flowers).length,
    West: toList(input.seats.West.flowers).length,
  };

  const lowConfidenceReasons = getLowConfidenceReasons(input, patterns);

  return {
    gameState: {
      winnerSeat: input.winnerSeat,
      winType: input.winType,
      discarderSeat: input.winType === "Ron" ? input.discarderSeat : null,
      totalFan,
      isLimitHand,
    },
    detectedPatterns: patterns,
    flowerCount,
    confidenceScore: input.confidenceScore,
    lowConfidenceReasons,
    source,
    rawExtraction: input,
    feiCount: input.feiCount,
    kongCount: input.selfKongCount,
    reason:
      lowConfidenceReasons.length > 0
        ? lowConfidenceReasons.join(" ")
        : `Deterministic scoring (${RULES_VERSION}) applied.`,
  };
};
