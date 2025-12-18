
import { LamiGameSettings, LamiRoundInput, LamiRoundResult, LamiPlayer } from '../types';

export const calculateLamiPayout = (
  inputs: LamiRoundInput[],
  isCleared: boolean,
  settings: LamiGameSettings,
  players: LamiPlayer[]
): LamiRoundResult => {
  const { basePayTable, clearHandFixedPrice, enableJoker, enableAce, jokerUnitValue, aceUnitValue } = settings;

  // 1. Determine Rank (Sort by Points ASC, then Suit Priority ASC)
  const sortedInputs = [...inputs].sort((a, b) => {
    if (a.points !== b.points) return a.points - b.points;
    return a.suitPriority - b.suitPriority; 
  });

  const winner = sortedInputs[0];
  const loser1 = sortedInputs[1]; // Rank 2
  const loser2 = sortedInputs[2]; // Rank 3
  const loser3 = sortedInputs[3]; // Rank 4

  // Initialize Ledger
  const ledger = new Map<number, { main: number, joker: number, ace: number }>();
  inputs.forEach(i => ledger.set(i.playerId, { main: 0, joker: 0, ace: 0 }));

  // --- 2. Main Settlement ---
  // If winner clears hand, every loser pays the FIXED PRICE.
  // Otherwise, they pay based on their Rank.
  let pays: [number, number, number];
  if (isCleared) {
    pays = [clearHandFixedPrice, clearHandFixedPrice, clearHandFixedPrice];
  } else {
    pays = [...basePayTable];
  }

  // Apply Main Transactions (Losers pay Winner)
  const applyMainPayment = (payerId: number, amount: number) => {
    const payer = ledger.get(payerId)!;
    const winnerL = ledger.get(winner.playerId)!;
    payer.main -= amount;
    winnerL.main += amount;
  };

  applyMainPayment(loser1.playerId, pays[0]);
  applyMainPayment(loser2.playerId, pays[1]);
  applyMainPayment(loser3.playerId, pays[2]);

  // --- 3. Side Settlement (Joker) ---
  if (enableJoker) {
    for (let i = 0; i < inputs.length; i++) {
      for (let j = i + 1; j < inputs.length; j++) {
        const pA = inputs[i];
        const pB = inputs[j];
        
        const diff = pA.jokerCount - pB.jokerCount;
        const amount = Math.abs(diff) * jokerUnitValue;

        if (amount > 0) {
           const ledgerA = ledger.get(pA.playerId)!;
           const ledgerB = ledger.get(pB.playerId)!;

           if (diff > 0) {
             ledgerB.joker -= amount;
             ledgerA.joker += amount;
           } else {
             ledgerA.joker -= amount;
             ledgerB.joker += amount;
           }
        }
      }
    }
  }

  // --- 4. Side Settlement (Ace) ---
  if (enableAce) {
    for (let i = 0; i < inputs.length; i++) {
      for (let j = i + 1; j < inputs.length; j++) {
        const pA = inputs[i];
        const pB = inputs[j];
        
        const diff = pA.aceCount - pB.aceCount;
        const amount = Math.abs(diff) * aceUnitValue;

        if (amount > 0) {
           const ledgerA = ledger.get(pA.playerId)!;
           const ledgerB = ledger.get(pB.playerId)!;

           if (diff > 0) {
             ledgerB.ace -= amount;
             ledgerA.ace += amount;
           } else {
             ledgerA.ace -= amount;
             ledgerB.ace += amount;
           }
        }
      }
    }
  }

  const transactions = Array.from(ledger.entries()).map(([pid, val]) => ({
    playerId: pid,
    totalAmount: val.main + val.joker + val.ace,
    mainAmount: val.main,
    jokerAmount: val.joker,
    aceAmount: val.ace
  }));

  const inputsMap: Record<number, LamiRoundInput> = {};
  inputs.forEach(i => inputsMap[i.playerId] = i);

  return {
    id: Date.now(),
    timestamp: Date.now(),
    winnerId: winner.playerId,
    isCleared,
    inputs: inputsMap,
    transactions
  };
};
