import { GameSettings, Player } from './types';

export const DEFAULT_SETTINGS: GameSettings = {
  baseValue: 1.0, // $1 per Fan default
  burstFan: 10,   // 10 Fan limit default
  enableFei: true,
  enableKong: true,
};

export const INITIAL_PLAYERS: Player[] = [
  { id: 1, name: 'Player 1', score: 0 },
  { id: 2, name: 'Player 2', score: 0 },
  { id: 3, name: 'Player 3', score: 0 },
];