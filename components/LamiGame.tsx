import React, { useState } from 'react';
import { Settings, RotateCcw, Trash2, CircleHelp } from 'lucide-react';
import { LamiPlayer, LamiGameSettings, LamiRoundResult, LamiRoundInput } from '../types';
import { INITIAL_LAMI_PLAYERS, DEFAULT_LAMI_SETTINGS } from '../constants';
import { calculateLamiPayout } from '../services/lamiLogic';
import { LamiSettingsModal } from './LamiSettingsModal';
import { LamiScoringForm } from './LamiScoringForm';
import { LamiHelpModal } from './LamiHelpModal';
import { LamiHistoryDetailModal } from './LamiHistoryDetailModal';

export const LamiGame = () => {
  const [players, setPlayers] = useState<LamiPlayer[]>(INITIAL_LAMI_PLAYERS);
  const [settings, setSettings] = useState<LamiGameSettings>(DEFAULT_LAMI_SETTINGS);
  const [history, setHistory] = useState<LamiRoundResult[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [viewingResult, setViewingResult] = useState<LamiRoundResult | null>(null);

  const handleCalculate = (inputs: LamiRoundInput[], isCleared: boolean) => {
    const result = calculateLamiPayout(inputs, isCleared, settings, players);
    
    // Update balances
    setPlayers(prev => prev.map(p => {
        const tx = result.transactions.find(t => t.playerId === p.id);
        return tx ? { ...p, score: p.score + tx.totalAmount } : p;
    }));
    
    setHistory(prev => [result, ...prev]);
  };

  const resetGame = () => {
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    setHistory([]);
  };

  const deleteRound = (roundId: number) => {
    // Find the round in the current history
    const roundToDelete = history.find(h => h.id === roundId);
    if (!roundToDelete) return;

    // Revert scores
    setPlayers(prevPlayers => prevPlayers.map(p => {
        const tx = roundToDelete.transactions.find(t => t.playerId === p.id);
        if (tx) {
            return { ...p, score: p.score - tx.totalAmount };
        }
        return p;
    }));

    // Remove from history
    setHistory(prevHistory => prevHistory.filter(h => h.id !== roundId));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-end gap-2 px-2 relative z-10">
         <button onClick={resetGame} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition active:scale-95" title="Reset Scores">
            <RotateCcw size={20} />
         </button>
         <button onClick={() => setIsHelpOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition active:scale-95" title="Help">
            <CircleHelp size={20} />
         </button>
         <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition active:scale-95" title="Settings">
            <Settings size={20} />
         </button>
      </div>

      {/* Scoreboard */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative z-0">
        <div className="grid grid-cols-4 gap-2 text-center divide-x divide-gray-100">
           {players.map(p => (
              <div key={p.id} className="flex flex-col items-center">
                 <div className="text-xs text-gray-500 mb-1 font-bold truncate w-full px-1">{p.name}</div>
                 <div className={`font-mono font-bold text-lg ${p.score >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                    {p.score > 0 ? '+' : ''}{p.score.toFixed(1)}
                 </div>
              </div>
           ))}
        </div>
      </div>

      <LamiScoringForm 
         players={players} 
         settings={settings}
         onCalculate={handleCalculate}
      />

      {/* History */}
      <div className="space-y-4">
         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-2">History</h3>
         {history.length === 0 && <p className="text-center text-gray-300 py-4 text-xs italic">No rounds played yet</p>}
         {history.map(round => {
             const winner = players.find(p => p.id === round.winnerId);
             return (
                 <div key={round.id} className="flex gap-2 group items-stretch animate-slide-in">
                     <div 
                        onClick={() => setViewingResult(round)}
                        className="flex-1 text-left bg-white p-3 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                     >
                        <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                           <div className="flex items-center">
                              <span className="font-bold text-blue-800">{winner?.name} Won</span>
                              {round.isCleared && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold shadow-sm">Cleared</span>}
                           </div>
                           <div className="text-xs text-gray-400">
                               {new Date(round.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </div>
                        </div>
                        
                        <div className="space-y-1">
                            {players.map(p => {
                                const t = round.transactions.find(tx => tx.playerId === p.id);
                                if (!t) return null;
                                const isWinner = p.id === round.winnerId;
                                return (
                                    <div key={p.id} className="flex justify-between items-center text-xs">
                                        <span className={isWinner ? 'font-bold' : 'text-gray-600'}>{p.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-300 font-mono text-[9px]">
                                                (M:{t.mainAmount > 0 ? '+' : ''}{t.mainAmount} 
                                                {settings.enableJoker && ` J:${t.jokerAmount > 0 ? '+' : ''}${t.jokerAmount}`}
                                                {settings.enableAce && ` A:${t.aceAmount > 0 ? '+' : ''}${t.aceAmount}`}
                                                )
                                            </span>
                                            <span className={`font-mono font-bold w-10 text-right ${t.totalAmount >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                                {t.totalAmount > 0 ? '+' : ''}{t.totalAmount}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                     </div>
                     <button
                         onClick={() => deleteRound(round.id)} 
                         className="w-12 bg-white flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl border border-gray-200 transition shadow-sm active:scale-95"
                         title="Delete Round"
                     >
                         <Trash2 size={20} />
                     </button>
                 </div>
             );
         })}
      </div>

      <LamiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
        players={players}
        onUpdatePlayers={setPlayers}
      />

      <LamiHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <LamiHistoryDetailModal
        isOpen={!!viewingResult}
        result={viewingResult}
        onClose={() => setViewingResult(null)}
        players={players}
      />
    </div>
  );
};