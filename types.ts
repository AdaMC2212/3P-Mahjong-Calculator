
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
  selfKongs: number;
  // Map of DiscarderId -> Count of Kongs they discarded to this player
  discardedKongs: Record<number, number>;
}

export interface RoundResult {
  winnerId: number;
  winType: WinType;
  discarderId?: number; // Only if CHUN
  fan: number;
  isBurst: boolean;
  playerStats: Record<number, PlayerBonusStats>;
  loserSettlement?: {
    player1Id: number;
    player1Fan: number;
    player2Id: number;
    player2Fan: number;
    amount: number; // Amount exchanged between losers
    fromId: number;
    toId: number;
  };
  breakdown: {
    baseHandMoney: number;
    burstMultiplier: number;
    handFullPrice: number; 
    handHalfPrice: number; 
    unitBonusValue: number; // The value of one Fei or Self-Kong (Base * 2)
  };
  transactions: {
    playerId: number;
    amount: number;
    handAmount: number; // Portion from hand win
    bonusAmount: number; // Portion from Fei/Kong
    loserSettlementAmount: number; // Portion from loser-to-loser settlement
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
  hasFullAceSuits: boolean; // New: If true, Ace payout is doubled
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
