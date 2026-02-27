import React from 'react';
import { BarChart3, X } from 'lucide-react';
import { Player, RoundResult, WinType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  history: RoundResult[];
}

export const MahjongReportModal: React.FC<Props> = ({ isOpen, onClose, players, history }) => {
  if (!isOpen) return null;

  const totalRounds = history.length;
  const playerReport = players.map((player) => {
    const wonRounds = history.filter((round) => round.winnerId === player.id);
    const wins = wonRounds.length;
    const zimoWins = wonRounds.filter((round) => round.winType === WinType.ZIMO).length;
    const chunWins = wins - zimoWins;
    const averageWinFan = wins > 0
      ? wonRounds.reduce((sum, round) => sum + round.fan, 0) / wins
      : 0;
    const netAmount = history.reduce((sum, round) => {
      const transaction = round.transactions.find((tx) => tx.playerId === player.id);
      return sum + (transaction?.amount || 0);
    }, 0);

    return {
      player,
      wins,
      zimoWins,
      chunWins,
      averageWinFan,
      winRate: totalRounds > 0 ? (wins / totalRounds) * 100 : 0,
      netAmount
    };
  });

  const maxWins = Math.max(1, ...playerReport.map((item) => item.wins));
  const maxAbsNet = Math.max(1, ...playerReport.map((item) => Math.abs(item.netAmount)));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        <div className="bg-mj-green p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 size={18} />
            Mahjong Round Report
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div className="text-gray-500 font-bold uppercase text-xs">Rounds In This Report</div>
            <div className="text-2xl font-mono font-bold text-gray-900">{totalRounds}</div>
          </div>

          <section className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Player Breakdown</h3>
            <div className="space-y-2">
              {playerReport.map((item) => (
                <div key={item.player.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-800">{item.player.name}</span>
                    <span className={`font-mono font-bold ${item.netAmount >= 0 ? 'text-mj-table' : 'text-red-500'}`}>
                      {item.netAmount >= 0 ? '+' : ''}{item.netAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                    <div>Wins: <span className="font-bold text-gray-800">{item.wins}</span></div>
                    <div>Win Rate: <span className="font-bold text-gray-800">{item.winRate.toFixed(0)}%</span></div>
                    <div>Zimo: <span className="font-bold text-gray-800">{item.zimoWins}</span></div>
                    <div>Discard: <span className="font-bold text-gray-800">{item.chunWins}</span></div>
                    <div className="col-span-2">Avg Fan (when won): <span className="font-bold text-gray-800">{item.averageWinFan.toFixed(1)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Win Share</h3>
            <div className="space-y-2">
              {playerReport.map((item) => {
                const widthPct = (item.wins / maxWins) * 100;

                return (
                  <div key={item.player.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-gray-700">{item.player.name}</span>
                      <span className="font-mono text-gray-500">{item.wins} wins ({item.winRate.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 bg-white rounded-full overflow-hidden border border-gray-100">
                      <div className="h-full bg-mj-table" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Settlement</h3>
            <div className="space-y-2">
              {playerReport.map((item) => {
                const widthPct = (Math.abs(item.netAmount) / maxAbsNet) * 50;

                return (
                  <div key={item.player.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-gray-700">{item.player.name}</span>
                      <span className={`font-mono font-bold ${item.netAmount >= 0 ? 'text-mj-table' : 'text-red-500'}`}>
                        {item.netAmount >= 0 ? '+' : ''}{item.netAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-white rounded-full border border-gray-100 relative overflow-hidden">
                      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-300" />
                      {item.netAmount >= 0 ? (
                        <div
                          className="absolute top-0 bottom-0 left-1/2 bg-mj-table"
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
