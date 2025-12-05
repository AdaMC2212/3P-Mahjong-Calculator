import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings, RotateCcw, Crown, ChevronRight } from 'lucide-react';
import { Player, GameSettings, RoundResult, WinType, PlayerBonusStats } from './types';
import { DEFAULT_SETTINGS, INITIAL_PLAYERS } from './constants';
import { calculatePayout } from './services/scoringLogic';
import { SettingsModal } from './components/SettingsModal';
import { ScoringForm } from './components/ScoringForm';
import { HistoryDetailModal } from './components/HistoryDetailModal';

const App = () => {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [dealerId, setDealerId] = useState<number>(INITIAL_PLAYERS[0].id); // Track who is East (Dealer)
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  
  // State for History Modal
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

    // Update Scores
    const updatedPlayers = players.map(p => {
      const transaction = result.transactions.find(t => t.playerId === p.id);
      return transaction ? { ...p, score: p.score + transaction.amount } : p;
    });

    setPlayers(updatedPlayers);
    setHistory([result, ...history]);
    setLastResult(result);
    
    // Rotate Dealer: "The winner for the round will be the next 东家"
    setDealerId(winnerId);
  };

  const resetGame = () => {
    if (confirm("Reset all scores and set Dealer to Player 1?")) {
      setPlayers(INITIAL_PLAYERS);
      setDealerId(INITIAL_PLAYERS[0].id);
      setHistory([]);
      setLastResult(null);
    }
  };

  const getWindInfo = (playerId: number) => {
    const dealerIndex = players.findIndex(p => p.id === dealerId);
    const playerIndex = players.findIndex(p => p.id === playerId);
    const offset = (playerIndex - dealerIndex + 3) % 3;
    
    // 0 = East, 1 = South, 2 = West
    switch (offset) {
      case 0: return { label: '东', full: 'East', bg: 'bg-red-500', text: 'text-white' };
      case 1: return { label: '南', full: 'South', bg: 'bg-gray-200', text: 'text-gray-600' };
      case 2: return { label: '西', full: 'West', bg: 'bg-gray-200', text: 'text-gray-600' };
      default: return { label: '-', full: '-', bg: 'bg-gray-200', text: 'text-gray-600' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-mj-green text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">3PMahjong Calculator</h1>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={resetGame}
              className="p-2 hover:bg-white/10 rounded-full transition"
              aria-label="Reset Game"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 flex-1 w-full">
        {/* Scoreboard */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
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

        {/* Input Form */}
        <ScoringForm 
          players={players} 
          settings={settings} 
          dealerId={dealerId}
          onCalculate={handleCalculate} 
        />

        {/* Last Result Notification */}
        {lastResult && (
          <div className="bg-mj-green/10 border border-mj-green rounded-xl p-4 animate-fade-in-up">
            <h3 className="font-bold text-mj-green mb-2 flex items-center gap-2">
               Last Round Result
            </h3>
            <div className="text-sm space-y-1 text-gray-700">
              <div className="flex justify-between font-medium">
                <span>Hand Score ({lastResult.fan} Fan):</span>
                <span>${lastResult.breakdown.baseHandMoney.toFixed(2)} {lastResult.isBurst && '(x2)'}</span>
              </div>
              
              <div className="border-t border-gray-300 my-2 pt-2">
                <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Net Changes</p>
                <div className="space-y-2">
                  {lastResult.transactions.map(t => {
                     const p = players.find(pl => pl.id === t.playerId);
                     const stats = lastResult.playerStats[t.playerId];
                     const bonusCount = (settings.enableFei ? stats?.fei || 0 : 0) + (settings.enableKong ? stats?.kong || 0 : 0);
                     
                     return (
                       <div key={t.playerId} className="flex justify-between items-center bg-white/50 p-2 rounded">
                         <div className="flex flex-col">
                            <span className="font-bold">{p?.name}</span>
                            <span className="text-[10px] text-gray-500">
                                {t.playerId === lastResult.winnerId ? 'WINNER ' : ''}
                                {bonusCount > 0 ? `+${bonusCount} Bonus ` : ''}
                            </span>
                         </div>
                         <div className="text-right">
                           <span className={`block font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}
                           </span>
                           <span className="text-[10px] text-gray-400 block">
                              Hand: {t.handAmount > 0 ? '+' : ''}{t.handAmount.toFixed(2)} | Bonus: {t.bonusAmount > 0 ? '+' : ''}{t.bonusAmount.toFixed(2)}
                           </span>
                         </div>
                       </div>
                     )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent History */}
        {history.length > 0 && (
          <div className="space-y-3">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">History</h3>
             {history.map((h, idx) => (
                <button 
                  key={h.timestamp} 
                  onClick={() => setViewingResult(h)}
                  className="w-full bg-white p-3 rounded-lg shadow-sm flex justify-between items-center text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition border border-transparent hover:border-gray-200"
                >
                   <div className="flex flex-col items-start">
                     <span className="font-bold text-gray-900">{players.find(p => p.id === h.winnerId)?.name}</span>
                     <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            h.winType === WinType.ZIMO ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                           {h.winType === WinType.ZIMO ? 'Zimo' : 'Chun'}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="font-mono font-bold">
                        {h.fan} Fan
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                   </div>
                </button>
             ))}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-gray-400 text-xs font-medium">
        <p>Created by Adam Chia</p>
      </footer>

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
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);