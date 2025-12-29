
import React, { useState } from 'react';
import { Settings, RotateCcw, Trash2, CircleHelp } from 'lucide-react';
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
  const [viewingResult, setViewingResult] = useState<RoundResult | null>(null);

  const handleCalculate = (
    winnerId: number,
    fan: number,
    playerStats: Record<number, PlayerBonusStats>,
    winType: WinType,
    discarderId?: number,
    loserFans: Record<number, number> = {}
  ) => {
    const playerIds = players.map(p => p.id);
    const result = calculatePayout(
      winnerId,
      fan,
      playerStats,
      winType,
      discarderId,
      settings,
      playerIds,
      loserFans
    );

    const updatedPlayers = players.map(p => {
      const transaction = result.transactions.find(t => t.playerId === p.id);
      return transaction ? { ...p, score: p.score + transaction.amount } : p;
    });

    setPlayers(updatedPlayers);
    setHistory(prev => [result, ...prev]);
    setDealerId(winnerId);
  };

  const deleteRound = (timestamp: number) => {
    const roundToDelete = history.find(h => h.timestamp === timestamp);
    if (!roundToDelete) return;
    setPlayers(prevPlayers => prevPlayers.map(p => {
      const tx = roundToDelete.transactions.find(t => t.playerId === p.id);
      return tx ? { ...p, score: p.score - tx.amount } : p;
    }));
    setHistory(prev => prev.filter(h => h.timestamp !== timestamp));
  };

  const resetGame = () => {
    setPlayers(INITIAL_PLAYERS.map(p => ({ ...p, score: 0 })));
    setDealerId(INITIAL_PLAYERS[0].id);
    setHistory([]);
  };

  const getWind = (playerId: number) => {
    const dealerIdx = players.findIndex(p => p.id === dealerId);
    const playerIdx = players.findIndex(p => p.id === playerId);
    const diff = (playerIdx - dealerIdx + 3) % 3;
    const winds = ['东', '南', '西'];
    return winds[diff];
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-end gap-2 px-2 relative z-10">
        <button onClick={resetGame} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition" title="Reset">
          <RotateCcw size={20} />
        </button>
        <button onClick={() => setIsHelpOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition" title="Help">
          <CircleHelp size={20} />
        </button>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition" title="Settings">
          <Settings size={20} />
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          {players.map(p => {
            const wind = getWind(p.id);
            return (
              <div key={p.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-2 shadow-sm ${wind === '东' ? 'bg-mj-red' : 'bg-gray-200 text-gray-500'}`}>
                  {wind}
                </div>
                <div className="text-xs font-bold text-gray-500 mb-1">{p.name}</div>
                <div className={`text-lg font-mono font-bold ${p.score >= 0 ? 'text-mj-table' : 'text-mj-red'}`}>
                  {p.score.toFixed(2)}
                </div>
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
        getWind={getWind}
      />

      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-2">History</h3>
          {history.map((h) => (
            <div key={h.timestamp} className="flex gap-2 group items-stretch">
              <button 
                onClick={() => setViewingResult(h)}
                className="flex-1 bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center text-sm border border-transparent hover:border-mj-table/20"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-gray-900">{players.find(p => p.id === h.winnerId)?.name} Won</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">{h.winType === WinType.ZIMO ? 'Self Draw' : 'Discard'}</span>
                </div>
                <div className="font-mono font-bold text-mj-table text-base">{h.fan} Fan</div>
              </button>
              <button 
                onClick={() => deleteRound(h.timestamp)} 
                className="w-12 bg-white flex items-center justify-center text-gray-300 hover:text-mj-red rounded-2xl border shadow-sm transition-colors"
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
      <HistoryDetailModal isOpen={!!viewingResult} result={viewingResult} onClose={() => setViewingResult(null)} players={players} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
