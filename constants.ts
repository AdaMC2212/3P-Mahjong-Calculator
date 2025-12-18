
import { GameSettings, Player, LamiGameSettings, LamiPlayer } from './types';

export const DEFAULT_SETTINGS: GameSettings = {
  baseValue: 1.0, // $1 per Fan default
  burstFan: 10,   // 10 Fan limit default
  enableFei: true,
  enableKong: true,
};

export const DEFAULT_LAMI_SETTINGS: LamiGameSettings = {
  basePayTable: [1, 2, 3], // Rank 2 pays 1, Rank 3 pays 2, Rank 4 pays 3
  clearHandFixedPrice: 5, 
  jokerUnitValue: 1.0,
  aceUnitValue: 1.0,
  enableJoker: true,
  enableAce: true,
};

export const INITIAL_PLAYERS: Player[] = [
  { id: 1, name: 'Player 1', score: 0 },
  { id: 2, name: 'Player 2', score: 0 },
  { id: 3, name: 'Player 3', score: 0 },
];

export const INITIAL_LAMI_PLAYERS: LamiPlayer[] = [
  { id: 1, name: 'Player 1', score: 0 },
  { id: 2, name: 'Player 2', score: 0 },
  { id: 3, name: 'Player 3', score: 0 },
  { id: 4, name: 'Player 4', score: 0 },
];
