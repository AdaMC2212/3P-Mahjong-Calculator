import { GameSettings, RoundResult, WinType, PlayerBonusStats } from '../types';

export const calculatePayout = (
  winnerId: number,
  fan: number,
  playerStats: Record<number, PlayerBonusStats>,
  winType: WinType,
  discarderId: number | undefined,
  settings: GameSettings,
  playerIds: number[]
): RoundResult => {
  const { baseValue, burstFan, enableFei, enableKong } = settings;

  // --- 1. Hand Score Calculation (Winner takes from Losers) ---
  
  // Calculate Base Hand Value (Fan only)
  const rawHandMoney = fan * baseValue;

  // Check Burst (Bao)
  const isBurst = fan >= burstFan;
  const burstMultiplier = isBurst ? 2 : 1;
  const handFullPrice = rawHandMoney * burstMultiplier;
  const handHalfPrice = handFullPrice / 2;

  // Initialize transactions map
  const transactionsMap = new Map<number, { hand: number; bonus: number }>();
  playerIds.forEach(id => transactionsMap.set(id, { hand: 0, bonus: 0 }));

  // Apply Hand Transactions
  playerIds.forEach((pid) => {
    if (pid === winnerId) return; // Skip winner processing here, they receive the sum later

    let payment = 0;
    if (winType === WinType.ZIMO) {
      // Self-draw: Both others pay full price
      payment = handFullPrice;
    } else {
      // Discard win (CHUN)
      if (pid === discarderId) {
        // Discarder pays full price
        payment = handFullPrice;
      } else {
        // Third player pays half price
        payment = handHalfPrice;
      }
    }

    // Deduct from loser
    const t = transactionsMap.get(pid)!;
    t.hand -= payment;
    transactionsMap.set(pid, t);

    // Add to winner
    const w = transactionsMap.get(winnerId)!;
    w.hand += payment;
    transactionsMap.set(winnerId, w);
  });

  // --- 2. Bonus Score Calculation (Fei/Kong - All players settle) ---
  // Rule: Fei/Kong counts as "1 Fan x 2 money value" (BaseValue * 2)
  const unitBonusValue = baseValue * 2;

  playerIds.forEach((receiverId) => {
    const stats = playerStats[receiverId] || { fei: 0, kong: 0 };
    let totalCount = 0;
    if (enableFei) totalCount += stats.fei;
    if (enableKong) totalCount += stats.kong;

    if (totalCount > 0) {
      const payoutPerPlayer = totalCount * unitBonusValue;

      playerIds.forEach((payerId) => {
        if (payerId === receiverId) return;

        // Payer pays Receiver
        const payerT = transactionsMap.get(payerId)!;
        payerT.bonus -= payoutPerPlayer;
        transactionsMap.set(payerId, payerT);

        const receiverT = transactionsMap.get(receiverId)!;
        receiverT.bonus += payoutPerPlayer;
        transactionsMap.set(receiverId, receiverT);
      });
    }
  });

  // --- 3. Finalize Result ---
  const transactions = Array.from(transactionsMap.entries()).map(([pid, t]) => ({
    playerId: pid,
    amount: t.hand + t.bonus,
    handAmount: t.hand,
    bonusAmount: t.bonus
  }));

  return {
    winnerId,
    winType,
    discarderId,
    fan,
    isBurst,
    playerStats,
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