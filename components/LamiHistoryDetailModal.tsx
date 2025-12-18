import React from 'react';
import { X, Trophy, AlertTriangle, ArrowRight, Zap, Layers, Spade } from 'lucide-react';
import { LamiRoundResult, LamiPlayer } from '../types.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: LamiRoundResult | null;
  players: LamiPlayer[];
}

export const LamiHistoryDetailModal: React.FC<Props> = ({ isOpen, onClose, result, players }) => {
  if (!isOpen || !result) return null;

  const getName = (id: number) => players.find((p) => p.id === id)?.name || `P${id}`;
  const winnerName = getName(result.winnerId);
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Header */}
        <div className="bg-blue-900 p-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              Round Details
            </h2>
            <p className="text-xs text-blue-200">{formatDate(result.timestamp)}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* Summary Banner */}
          <div className="bg-blue-50 p-6 text-center border-b border-blue-100">
            <div className="inline-flex items-center gap-2 text-blue-600 font-bold uppercase tracking-wider text-xs mb-2">
              <Trophy size={14} /> Winner
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{winnerName}</h1>
            {result.isCleared ? (
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-yellow-200">
                    ✨ Cleared Hand (Fixed Price)
                </span>
            ) : (
                <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                    Standard Rank Settlement
                </span>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Player Results List */}
            <div className="space-y-3">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transactions</h3>
               <div className="space-y-3">
                 {players.map(player => {
                   const t = result.transactions.find(tr => tr.playerId === player.id);
                   const input = result.inputs[player.id];
                   
                   if (!t || !input) return null;

                   const isWinner = player.id === result.winnerId;

                   return (
                     <div key={player.id} className={`border rounded-xl overflow-hidden shadow-sm ${isWinner ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-white'}`}>
                       {/* Row Header */}
                       <div className="flex justify-between items-center p-3 border-b border-gray-50">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${isWinner ? 'text-blue-700' : 'text-gray-700'}`}>
                                {player.name}
                                </span>
                                {isWinner && <Trophy size={14} className="text-mj-gold" />}
                            </div>
                            <div className="text-[10px] text-gray-400 flex gap-2">
                                <span>Pts: {input.points}</span>
                                {input.suitPriority && <span>Pri: {input.suitPriority}</span>}
                            </div>
                          </div>
                          <span className={`text-lg font-mono font-bold ${t.totalAmount >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                            {t.totalAmount > 0 ? '+' : ''}{t.totalAmount.toFixed(2)}
                          </span>
                       </div>

                       {/* Breakdown Details */}
                       <div className="grid grid-cols-3 gap-px bg-gray-100 text-[10px]">
                          <div className="bg-white p-2 flex flex-col items-center">
                             <span className="text-gray-400 uppercase font-bold tracking-tighter">Main</span>
                             <span className={`font-mono font-bold ${t.mainAmount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {t.mainAmount > 0 ? '+' : ''}{t.mainAmount}
                             </span>
                          </div>
                          <div className="bg-white p-2 flex flex-col items-center">
                             <span className="text-gray-400 uppercase font-bold tracking-tighter flex items-center gap-1">
                                <span className="text-base">🃏</span> {input.jokerCount}
                             </span>
                             <span className={`font-mono font-bold ${t.jokerAmount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {t.jokerAmount > 0 ? '+' : ''}{t.jokerAmount}
                             </span>
                          </div>
                          <div className="bg-white p-2 flex flex-col items-center">
                             <span className="text-gray-400 uppercase font-bold tracking-tighter flex items-center gap-1">
                                <span className="text-base text-red-500">A</span> {input.aceCount}
                             </span>
                             <span className={`font-mono font-bold ${t.aceAmount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {t.aceAmount > 0 ? '+' : ''}{t.aceAmount}
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