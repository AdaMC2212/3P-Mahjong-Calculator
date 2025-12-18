
export interface Player {
  id: number;
  name: string;
  score: number;
}

// --- MAHJONG TYPES ---

export interface GameSettings {
  baseValue: number; // Monetary value of 1 Fan
  burstFan: number; // Max Fan before doubling (Bao)
  enableFei: boolean; // Enable flying counting
  enableKong: boolean; // Enable kong counting
}

export enum WinType {
  ZIMO = 'ZIMO', // Self-draw
  CHUN = 'CHUN', // Discard win
}

export interface PlayerBonusStats {
  fei: number;
  kong: number;
}

export interface RoundResult {
  winnerId: number;
  winType: WinType;
  discarderId?: number; // Only if CHUN
  fan: number;
  isBurst: boolean;
  playerStats: Record<number, PlayerBonusStats>;
  breakdown: {
    baseHandMoney: number;
    burstMultiplier: number;
    handFullPrice: number; // The generic full price of the hand (fan only)
    handHalfPrice: number; // The half price of the hand
    unitBonusValue: number; // The value of one Fei or Kong (Base * 2)
  };
  transactions: {
    playerId: number;
    amount: number;
    handAmount: number; // Portion from hand win
    bonusAmount: number; // Portion from Fei/Kong
  }[];
  timestamp: number;
}

export interface HandAnalysis {
  fan: number;
  feiCount: number;
  kongCount: number;
  reason: string;
}

// --- LAMI TYPES ---

export interface LamiPlayer extends Player {
}

export interface LamiGameSettings {
  basePayTable: [number, number, number]; // Pay for Rank 2, Rank 3, Rank 4
  clearHandFixedPrice: number; // Fixed amount paid by Rank 2, 3, and 4 if winner clears hand
  jokerUnitValue: number;
  aceUnitValue: number;
  enableJoker: boolean;
  enableAce: boolean;
}

export interface LamiRoundInput {
  playerId: number;
  points: number;
  jokerCount: number;
  aceCount: number;
  suitPriority: number; // 1 (Highest) to 4 (Lowest)
}

export interface LamiRoundResult {
  id: number;
  timestamp: number;
  winnerId: number;
  isCleared: boolean;
  inputs: Record<number, LamiRoundInput>; // Map playerId -> Input
  transactions: {
    playerId: number;
    totalAmount: number;
    mainAmount: number;
    jokerAmount: number;
    aceAmount: number;
  }[];
}
