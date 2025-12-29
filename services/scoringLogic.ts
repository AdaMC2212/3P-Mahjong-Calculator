import { GameSettings, RoundResult, WinType, PlayerBonusStats } from '../types';

export const calculatePayout = (
  winnerId: number,
  fan: number,
  playerStats: Record<number, PlayerBonusStats>,
  winType: WinType,
  discarderId: number | undefined,
  settings: GameSettings,
  playerIds: number[],
  loserFans: Record<number, number>
): RoundResult => {
  const { baseValue, burstFan, enableFei, enableKong } = settings;

  // --- 1. Hand Score Calculation (Winner takes from Losers) ---
  const rawHandMoney = fan * baseValue;
  const isBurst = fan >= burstFan;
  const burstMultiplier = isBurst ? 2 : 1;
  const handFullPrice = rawHandMoney * burstMultiplier;
  const handHalfPrice = handFullPrice / 2;

  const transactionsMap = new Map<number, { hand: number; bonus: number; loserSettlement: number }>();
  playerIds.forEach(id => transactionsMap.set(id, { hand: 0, bonus: 0, loserSettlement: 0 }));

  // Apply Hand Transactions
  playerIds.forEach((pid) => {
    if (pid === winnerId) return;

    let payment = 0;
    if (winType === WinType.ZIMO) {
      payment = handFullPrice;
    } else {
      if (pid === discarderId) {
        payment = handFullPrice;
      } else {
        payment = handHalfPrice;
      }
    }

    const t = transactionsMap.get(pid)!;
    t.hand -= payment;
    transactionsMap.set(pid, t);

    const w = transactionsMap.get(winnerId)!;
    w.hand += payment;
    transactionsMap.set(winnerId, w);
  });

  // --- 2. Bonus Score Calculation (Fei/Kong) ---
  const unitBonusValue = baseValue * 2;

  playerIds.forEach((receiverId) => {
    const stats = playerStats[receiverId] || { fei: 0, selfKongs: 0, discardedKongs: {} };
    
    // Process Fei (Everyone pays 2x)
    if (enableFei && stats.fei > 0) {
      const payoutPerPlayer = stats.fei * unitBonusValue;
      playerIds.forEach((payerId) => {
        if (payerId === receiverId) return;
        transactionsMap.get(payerId)!.bonus -= payoutPerPlayer;
        transactionsMap.get(receiverId)!.bonus += payoutPerPlayer;
      });
    }

    // Process Kongs
    if (enableKong) {
      // Self-Draw Kongs (Everyone pays 2x)
      if (stats.selfKongs > 0) {
        const payoutPerPlayer = stats.selfKongs * unitBonusValue;
        playerIds.forEach((payerId) => {
          if (payerId === receiverId) return;
          transactionsMap.get(payerId)!.bonus -= payoutPerPlayer;
          transactionsMap.get(receiverId)!.bonus += payoutPerPlayer;
        });
      }

      // Discarded Kongs (Discarder pays 4x total - covers innocent player)
      Object.entries(stats.discardedKongs).forEach(([dIdStr, count]) => {
        const dId = parseInt(dIdStr);
        // Total payout is 4x Base Value per Kong, all from the discarder
        const totalPayout = count * (baseValue * 4); 
        
        transactionsMap.get(dId)!.bonus -= totalPayout;
        transactionsMap.get(receiverId)!.bonus += totalPayout;
      });
    }
  });

  // --- 3. Loser Settlement (Strictly Rule 2a & 2b) ---
  const losers = playerIds.filter(id => id !== winnerId);
  let loserSettlementData: RoundResult['loserSettlement'] | undefined;

  if (losers.length === 2) {
    const L1 = losers[0];
    const L2 = losers[1];
    const fan1 = Math.max(0, loserFans[L1] || 0);
    const fan2 = Math.max(0, loserFans[L2] || 0);

    let payFrom = -1;
    let payTo = -1;
    let payAmount = 0;

    // Rule 2a & 2b Logic
    if (fan1 >= 5 || fan2 >= 5) {
      if (fan1 >= 5 && fan2 < 5) {
        payFrom = L2;
        payTo = L1;
        payAmount = fan1 * baseValue; // Collect OWN full fan value
      } else if (fan2 >= 5 && fan1 < 5) {
        payFrom = L1;
        payTo = L2;
        payAmount = fan2 * baseValue; // Collect OWN full fan value
      } else if (fan1 >= 5 && fan2 >= 5) {
        if (fan1 > fan2) {
          payFrom = L2;
          payTo = L1;
          payAmount = fan1 * baseValue; // Higher fan collects OWN full fan value
        } else if (fan2 > fan1) {
          payFrom = L1;
          payTo = L2;
          payAmount = fan2 * baseValue; // Higher fan collects OWN full fan value
        }
        // Rule 2b caveat: if equal, no one collects money (payAmount remains 0)
      }
    }

    if (payAmount > 0) {
      transactionsMap.get(payFrom)!.loserSettlement -= payAmount;
      transactionsMap.get(payTo)!.loserSettlement += payAmount;
      loserSettlementData = {
        player1Id: L1,
        player1Fan: fan1,
        player2Id: L2,
        player2Fan: fan2,
        amount: payAmount,
        fromId: payFrom,
        toId: payTo
      };
    }
  }

  // --- 4. Finalize Result ---
  const transactions = Array.from(transactionsMap.entries()).map(([pid, t]) => ({
    playerId: pid,
    amount: t.hand + t.bonus + t.loserSettlement,
    handAmount: t.hand,
    bonusAmount: t.bonus,
    loserSettlementAmount: t.loserSettlement
  }));

  return {
    winnerId,
    winType,
    discarderId,
    fan,
    isBurst,
    playerStats,
    loserSettlement: loserSettlementData,
    breakdown: {
      baseHandMoney: rawHandMoney,
      burstMultiplier,
      handFullPrice,
      handHalfPrice,
      unitBonusValue
    },
    transactions,
    timestamp: Date.now()
  };
};