import React, { useState } from 'react';
import { Settings, RotateCcw, Crown, Trash2, CircleHelp } from 'lucide-react';
import { Player, GameSettings, RoundResult, WinType, PlayerBonusStats } from '../types';
import { DEFAULT_SETTINGS, INITIAL_PLAYERS } from '../constants';
import { calculatePayout } from '../services/scoringLogic';
import { SettingsModal } from './SettingsModal';
import { ScoringForm } from './ScoringForm';
import { HistoryDetailModal } from './HistoryDetailModal';
import { HelpModal } from './HelpModal';

export const MahjongGame = () => {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [dealerId, setDealerId] = useState<number>(INITIAL_PLAYERS[0].id);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [viewingResult, setViewingResult] = useState<RoundResult | null>(null);

  const handleCalculate = (
    winnerId: number,
    fan: number,
    playerStats: Record<number, PlayerBonusStats>,
    winType: WinType,
    discarderId?: number
  ) => {
    const playerIds = players.map(p => p.id);
    const result = calculatePayout(
      winnerId,
      fan,
      playerStats,
      winType,
      discarderId,
      settings,
      playerIds
    );

    const updatedPlayers = players.map(p => {
      const transaction = result.transactions.find(t => t.playerId === p.id);
      return transaction ? { ...p, score: p.score + transaction.amount } : p;
    });

    setPlayers(updatedPlayers);
    setHistory(prev => [result, ...prev]);
    setLastResult(result);
    setDealerId(winnerId);
  };

  const deleteRound = (timestamp: number) => {
    const roundToDelete = history.find(h => h.timestamp === timestamp);
    if (!roundToDelete) return;

    setPlayers(prevPlayers => prevPlayers.map(p => {
      const tx = roundToDelete.transactions.find(t => t.playerId === p.id);
      if (tx) {
        return { ...p, score: p.score - tx.amount };
      }
      return p;
    }));

    setHistory(prevHistory => {
        const newHistory = prevHistory.filter(h => h.timestamp !== timestamp);
        if (lastResult?.timestamp === timestamp) {
            setLastResult(newHistory.length > 0 ? newHistory[0] : null);
        }
        return newHistory;
    });
  };

  const resetGame = () => {
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    setDealerId(INITIAL_PLAYERS[0].id);
    setHistory([]);
    setLastResult(null);
  };

  const getWindInfo = (playerId: number) => {
    const dealerIndex = players.findIndex(p => p.id === dealerId);
    const playerIndex = players.findIndex(p => p.id === playerId);
    const offset = (playerIndex - dealerIndex + 3) % 3;
    switch (offset) {
      case 0: return { label: '东', full: 'East', bg: 'bg-red-500', text: 'text-white' };
      case 1: return { label: '南', full: 'South', bg: 'bg-gray-200', text: 'text-gray-600' };
      case 2: return { label: '西', full: 'West', bg: 'bg-gray-200', text: 'text-gray-600' };
      default: return { label: '-', full: '-', bg: 'bg-gray-200', text: 'text-gray-600' };
    }
  };

  return (
    <div className="space-y-6 pb-10">
       <div className="flex justify-end gap-2 px-2 relative z-10">
            <button 
              onClick={resetGame}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition active:scale-95"
              title="Reset Scores & Dealer"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition active:scale-95"
              title="Help"
            >
              <CircleHelp size={20} />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition active:scale-95"
              title="Settings"
            >
              <Settings size={20} />
            </button>
       </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative z-0">
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-gray-100">
            {players.map(p => {
              const wind = getWindInfo(p.id);
              const isWinner = lastResult?.winnerId === p.id;
              return (
                <div key={p.id} className="flex flex-col items-center relative">
                  <div className={`mb-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-serif shadow-sm ${wind.bg} ${wind.text}`}>
                    {wind.label}
                  </div>
                  <span className="text-sm text-gray-600 font-bold leading-tight line-clamp-1 px-1">
                    {p.name}
                  </span>
                  {isWinner && <Crown size={12} className="text-mj-gold absolute top-0 right-2 animate-bounce" />}
                  <span className={`text-xl font-mono font-bold mt-1 ${p.score >= 0 ? 'text-mj-table' : 'text-red-500'}`}>
                    {p.score > 0 ? '+' : ''}{p.score.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <ScoringForm 
          players={players} 
          settings={settings} 
          dealerId={dealerId}
          onCalculate={handleCalculate} 
        />

        {lastResult && (
          <div className="bg-mj-green/10 border border-mj-green rounded-xl p-4 animate-fade-in relative z-0">
            <h3 className="font-bold text-mj-green mb-2 flex items-center gap-2">Last Round Result</h3>
            <div className="text-sm space-y-1 text-gray-700">
              <div className="flex justify-between font-medium">
                <span>Hand Score ({lastResult.fan} Fan):</span>
                <span>${lastResult.breakdown.baseHandMoney.toFixed(2)} {lastResult.isBurst && '(x2)'}</span>
              </div>
              <div className="border-t border-gray-300 my-2 pt-2">
                <div className="space-y-2">
                  {lastResult.transactions.map(t => {
                     const p = players.find(pl => pl.id === t.playerId);
                     return (
                       <div key={t.playerId} className="flex justify-between items-center bg-white/50 p-2 rounded">
                         <span className="font-bold">{p?.name}</span>
                         <span className={`font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}
                         </span>
                       </div>
                     )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-3">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-2">History</h3>
             {history.map((h) => (
                <div key={h.timestamp} className="flex gap-2 group items-stretch">
                  <button 
                    onClick={() => setViewingResult(h)}
                    className="flex-1 bg-white p-3 rounded-lg shadow-sm flex justify-between items-center text-sm text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="font-bold text-gray-900">{players.find(p => p.id === h.winnerId)?.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              h.winType === WinType.ZIMO ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {h.winType === WinType.ZIMO ? 'Zimo' : 'Chun'}
                          </span>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-mj-green">{h.fan} Fan</div>
                  </button>
                  <button 
                    onClick={() => deleteRound(h.timestamp)}
                    className="w-12 bg-white flex items-center justify-center text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition shadow-sm active:scale-95"
                    title="Delete Round"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
             ))}
          </div>
        )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onSave={setSettings}
        players={players}
        onUpdatePlayers={setPlayers}
      />
      
      <HistoryDetailModal 
        isOpen={!!viewingResult}
        result={viewingResult}
        onClose={() => setViewingResult(null)}
        players={players}
      />

      <HelpModal 
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};