
import React from 'react';
import { X, Trophy, AlertTriangle, ArrowRight, Zap, Layers, Target } from 'lucide-react';
import { RoundResult, Player, WinType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: RoundResult | null;
  players: Player[];
}

export const HistoryDetailModal: React.FC<Props> = ({ isOpen, onClose, result, players }) => {
  if (!isOpen || !result) return null;

  const getName = (id: number) => players.find((p) => p.id === id)?.name || `P${id}`;
  const winnerName = getName(result.winnerId);
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-lg font-bold">Round Details</h2>
            <p className="text-xs text-gray-400">{new Date(result.timestamp).toLocaleTimeString()}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition"><X size={24} /></button>
        </div>

        <div className="p-0 overflow-y-auto">
          <div className="bg-mj-green/5 p-6 text-center border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">{winnerName} Won</h1>
            <div className="text-sm text-gray-600 mt-1">
               <span className={`px-2 py-0.5 rounded ${result.winType === WinType.ZIMO ? 'bg-mj-table/20 text-mj-table' : 'bg-red-100 text-red-600'}`}>
                 {result.winType === WinType.ZIMO ? 'Zimo' : 'Discard'}
               </span>
               <span className="ml-2 font-bold">{result.fan} Fan</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {result.loserSettlement && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-2 flex items-center gap-1">
                        <Target size={12} /> Loser Settlement
                    </h4>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{getName(result.loserSettlement.fromId)} → {getName(result.loserSettlement.toId)}</span>
                        <span className="font-mono font-bold text-blue-600">${result.loserSettlement.amount.toFixed(2)}</span>
                    </div>
                </div>
            )}

            <div className="space-y-3">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Player Results</h3>
               <div className="space-y-2">
                 {players.map(player => {
                   const t = result.transactions.find(tr => tr.playerId === player.id);
                   const stats = result.playerStats[player.id];
                   if (!t || !stats) return null;

                   return (
                     <div key={player.id} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm">
                       <div className="flex justify-between items-center mb-2">
                          <span className={`font-bold ${player.id === result.winnerId ? 'text-mj-table' : 'text-gray-700'}`}>{player.name}</span>
                          <span className={`text-lg font-mono font-bold ${t.amount >= 0 ? 'text-mj-table' : 'text-red-500'}`}>
                            {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}
                          </span>
                       </div>
                       <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 bg-gray-50 p-2 rounded">
                          <div className="flex justify-between"><span>Hand:</span><span>{t.handAmount.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span>Bonus:</span><span>{t.bonusAmount.toFixed(2)}</span></div>
                          {t.loserSettlementAmount !== 0 && (
                             <div className="flex justify-between col-span-2 border-t pt-1 mt-1 font-bold">
                                <span>Loser Payout:</span>
                                <span className={t.loserSettlementAmount > 0 ? 'text-blue-600' : 'text-red-500'}>{t.loserSettlementAmount.toFixed(2)}</span>
                             </div>
                          )}
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>
        </div>
        
        <div className="p-4"><button onClick={onClose} className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-lg">Close</button></div>
      </div>
    </div>
  );
};
