import React from 'react';
import { BarChart3, X } from 'lucide-react';
import { LamiPlayer, LamiRoundResult } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  players: LamiPlayer[];
  history: LamiRoundResult[];
}

export const LamiReportModal: React.FC<Props> = ({ isOpen, onClose, players, history }) => {
  if (!isOpen) return null;

  const totalRounds = history.length;
  const clearedCount = history.filter((round) => round.isCleared).length;
  const avgWinnerPoints = totalRounds > 0
    ? history.reduce((sum, round) => {
      const winnerInput = round.inputs[round.winnerId];
      return sum + (winnerInput?.points || 0);
    }, 0) / totalRounds
    : 0;

  const sideSettlementRounds = history.filter((round) => {
    return round.transactions.some((tx) => tx.jokerAmount !== 0 || tx.aceAmount !== 0);
  }).length;

  const winsByPlayer = players.reduce<Record<number, number>>((acc, player) => {
    acc[player.id] = history.filter((round) => round.winnerId === player.id).length;
    return acc;
  }, {});

  const netByPlayer = players.reduce<Record<number, number>>((acc, player) => {
    acc[player.id] = history.reduce((sum, round) => {
      const transaction = round.transactions.find((tx) => tx.playerId === player.id);
      return sum + (transaction?.totalAmount || 0);
    }, 0);
    return acc;
  }, {});

  const maxWins = Math.max(1, ...Object.values(winsByPlayer));
  const maxAbsNet = Math.max(1, ...Object.values(netByPlayer).map((amount) => Math.abs(amount)));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        <div className="bg-blue-700 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 size={18} />
            Lami Round Report
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="text-gray-500 font-bold uppercase">Total Rounds</div>
              <div className="text-2xl font-mono font-bold text-gray-900">{totalRounds}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="text-gray-500 font-bold uppercase">Cleared Rounds</div>
              <div className="text-2xl font-mono font-bold text-yellow-600">{clearedCount}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="text-gray-500 font-bold uppercase">Winner Avg Points</div>
              <div className="text-2xl font-mono font-bold text-blue-700">{avgWinnerPoints.toFixed(1)}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="text-gray-500 font-bold uppercase">Side Settlements</div>
              <div className="text-2xl font-mono font-bold text-purple-600">{sideSettlementRounds}</div>
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Win Share</h3>
            <div className="space-y-2">
              {players.map((player) => {
                const wins = winsByPlayer[player.id] || 0;
                const widthPct = (wins / maxWins) * 100;
                const sharePct = totalRounds > 0 ? (wins / totalRounds) * 100 : 0;

                return (
                  <div key={player.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-gray-700">{player.name}</span>
                      <span className="font-mono text-gray-500">{wins} wins ({sharePct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 bg-white rounded-full overflow-hidden border border-gray-100">
                      <div className="h-full bg-blue-600" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Settlement</h3>
            <div className="space-y-2">
              {players.map((player) => {
                const netAmount = netByPlayer[player.id] || 0;
                const widthPct = (Math.abs(netAmount) / maxAbsNet) * 50;

                return (
                  <div key={player.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-gray-700">{player.name}</span>
                      <span className={`font-mono font-bold ${netAmount >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                        {netAmount >= 0 ? '+' : ''}{netAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-white rounded-full border border-gray-100 relative overflow-hidden">
                      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-300" />
                      {netAmount >= 0 ? (
                        <div
                          className="absolute top-0 bottom-0 left-1/2 bg-blue-600"
                          style={{ width: `${widthPct}%` }}
                        />
                      ) : (
                        <div
                          className="absolute top-0 bottom-0 right-1/2 bg-red-400"
                          style={{ width: `${widthPct}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
