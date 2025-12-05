import React from 'react';
import { X, Trophy, AlertTriangle, ArrowRight, Zap, Layers } from 'lucide-react';
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
  const discarderName = result.discarderId ? getName(result.discarderId) : null;
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Header */}
        <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              Round Details
            </h2>
            <p className="text-xs text-gray-400">{formatDate(result.timestamp)}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-0 overflow-y-auto">
          {/* Summary Banner */}
          <div className="bg-mj-green/5 p-6 text-center border-b border-gray-100">
            <div className="inline-flex items-center gap-2 text-mj-green font-bold uppercase tracking-wider text-xs mb-2">
              <Trophy size={14} /> Winner
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{winnerName}</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
               <span className={`px-2 py-0.5 rounded ${result.winType === WinType.ZIMO ? 'bg-mj-table/20 text-mj-table' : 'bg-red-100 text-red-600'}`}>
                 {result.winType === WinType.ZIMO ? 'Self Draw (自摸)' : 'Discard (出铳)'}
               </span>
               {result.winType === WinType.CHUN && discarderName && (
                 <span className="flex items-center gap-1">
                   via <span className="font-bold">{discarderName}</span>
                 </span>
               )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Hand Calculation Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scoring Breakdown</h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fan Count</span>
                  <span className="font-bold">{result.fan} Fan</span>
                </div>
                {result.isBurst && (
                   <div className="flex justify-between text-red-600 font-bold">
                    <span className="flex items-center gap-1"><AlertTriangle size={12}/> Burst (爆番)</span>
                    <span>x{result.breakdown.burstMultiplier}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-gray-600">Base Hand Price</span>
                  <span className="font-mono">${result.breakdown.handFullPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bonus Unit Price (Fei/Kong)</span>
                  <span className="font-mono">${result.breakdown.unitBonusValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Detailed Transaction Table */}
            <div className="space-y-3">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Player Results</h3>
               <div className="space-y-2">
                 {players.map(player => {
                   const t = result.transactions.find(tr => tr.playerId === player.id);
                   const stats = result.playerStats[player.id];
                   
                   // Skip if something is wrong with data
                   if (!t || !stats) return null;

                   const isWinner = player.id === result.winnerId;
                   const isDiscarder = result.winType === WinType.CHUN && player.id === result.discarderId;

                   return (
                     <div key={player.id} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm">
                       <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isWinner ? 'text-mj-table' : 'text-gray-700'}`}>
                              {player.name}
                            </span>
                            {isWinner && <Trophy size={14} className="text-mj-gold" />}
                            {isDiscarder && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded">Discarder</span>}
                          </div>
                          <span className={`text-lg font-mono font-bold ${t.amount >= 0 ? 'text-mj-table' : 'text-red-500'}`}>
                            {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}
                          </span>
                       </div>

                       {/* Stats Badges */}
                       <div className="flex gap-2 mb-2">
                         {stats.fei > 0 && (
                           <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-yellow-100">
                             <Zap size={10} /> {stats.fei} Fei
                           </span>
                         )}
                         {stats.kong > 0 && (
                           <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-100">
                             <Layers size={10} /> {stats.kong} Kong
                           </span>
                         )}
                         {stats.fei === 0 && stats.kong === 0 && (
                           <span className="text-[10px] text-gray-300 italic">No Bonus Tiles</span>
                         )}
                       </div>

                       {/* Split Breakdown */}
                       <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 bg-gray-50 p-2 rounded">
                          <div className="flex justify-between">
                            <span>Hand:</span>
                            <span className={t.handAmount >= 0 ? 'text-green-600' : 'text-red-500'}>
                              {t.handAmount > 0 ? '+' : ''}{t.handAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bonus:</span>
                             <span className={t.bonusAmount >= 0 ? 'text-green-600' : 'text-red-500'}>
                              {t.bonusAmount > 0 ? '+' : ''}{t.bonusAmount.toFixed(2)}
                            </span>
                          </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>

          </div>
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100">
           <button 
             onClick={onClose}
             className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};