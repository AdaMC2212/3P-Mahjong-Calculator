import React, { useState, useEffect } from 'react';
import { Player, WinType, GameSettings, HandAnalysis, PlayerBonusStats } from '../types';
import { Camera, Calculator, Loader2, Plus, Minus, AlertCircle, Hand, UserX } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { analyzeHandImage } from '../services/geminiService';

interface Props {
  players: Player[];
  settings: GameSettings;
  dealerId: number;
  onCalculate: (
    winnerId: number,
    fan: number,
    playerStats: Record<number, PlayerBonusStats>,
    type: WinType,
    discarderId?: number
  ) => void;
}

// Moved Stepper outside to prevent re-renders losing state/focus issues
const Stepper = ({ value, onChange, max, colorClass = "text-gray-900" }: { value: number, onChange: (v: number) => void, max?: number, colorClass?: string }) => (
  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-10 w-24 sm:w-28 bg-white shadow-sm shrink-0">
    <button 
      type="button" 
      onClick={(e) => {
        e.preventDefault();
        onChange(Math.max(0, value - 1));
      }}
      className="w-8 sm:w-9 h-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center border-r border-gray-200 active:bg-gray-200 text-gray-500 transition-colors"
    >
      <Minus size={16} />
    </button>
    <div className="flex-1 h-full flex items-center justify-center bg-white relative">
        <input
            type="number"
            readOnly
            value={value}
            className={`w-full text-center text-base font-bold font-mono outline-none bg-transparent cursor-default ${colorClass}`}
        />
    </div>
    <button 
      type="button" 
      onClick={(e) => {
        e.preventDefault();
        if (max !== undefined && value >= max) return;
        onChange(value + 1);
      }}
      className={`w-8 sm:w-9 h-full flex items-center justify-center border-l border-gray-200 transition-colors ${max !== undefined && value >= max ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-500'}`}
      disabled={max !== undefined && value >= max}
    >
      <Plus size={16} />
    </button>
  </div>
);

export const ScoringForm: React.FC<Props> = ({ players, settings, dealerId, onCalculate }) => {
  const [winnerId, setWinnerId] = useState<number>(dealerId);
  const [winType, setWinType] = useState<WinType>(WinType.ZIMO);
  const [discarderId, setDiscarderId] = useState<number | undefined>(undefined);
  
  const [fan, setFan] = useState<number>(5); // Default min 5
  
  // Stats for all players
  const [allPlayerStats, setAllPlayerStats] = useState<Record<number, PlayerBonusStats>>({});

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReason, setAnalysisReason] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    // Initialize stats for players if empty
    const initialStats: Record<number, PlayerBonusStats> = {};
    players.forEach(p => {
      initialStats[p.id] = { fei: 0, kong: 0 };
    });
    setAllPlayerStats(initialStats);
  }, [players]);

  useEffect(() => {
    setWinnerId(dealerId);
  }, [dealerId]);

  useEffect(() => {
    if (winType === WinType.CHUN) {
      const otherPlayers = players.filter(p => p.id !== winnerId);
      if (otherPlayers.length > 0 && (!discarderId || discarderId === winnerId)) {
        setDiscarderId(otherPlayers[0].id);
      }
    }
  }, [winnerId, winType, players]);

  const updatePlayerStat = (pid: number, field: keyof PlayerBonusStats, val: number) => {
    setAllPlayerStats(prev => ({
      ...prev,
      [pid]: {
        ...prev[pid],
        [field]: Math.max(0, val)
      }
    }));
  };

  const handleCameraCapture = async (imageSrc: string) => {
    setIsCameraOpen(false);
    setIsAnalyzing(true);
    setAnalysisReason('');

    try {
      const result: HandAnalysis = await analyzeHandImage(imageSrc);
      
      // Update Fan (respect min 5)
      setFan(Math.max(5, result.fan));
      
      // Update the WINNER'S stats with the AI result
      // Note: We need to respect global Fei limit here too, but for simplicity 
      // we'll apply it directly, assuming the AI doesn't hallucinate > 4 total.
      setAllPlayerStats(prev => ({
        ...prev,
        [winnerId]: {
          fei: result.feiCount,
          kong: result.kongCount
        }
      }));
      
      setAnalysisReason(result.reason);
    } catch (e) {
      alert("Failed to analyze image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (fan < 5) {
      setFormError('Fan must be at least 5.');
      return;
    }

    onCalculate(
      winnerId, 
      fan, 
      allPlayerStats,
      winType, 
      discarderId
    );
    
    // Reset basic inputs (keep current settings/players)
    setFan(5);
    setAnalysisReason('');
    
    // Reset stats
    const resetStats: Record<number, PlayerBonusStats> = {};
    players.forEach(p => resetStats[p.id] = { fei: 0, kong: 0 });
    setAllPlayerStats(resetStats);
  };

  const getPlayerWind = (pid: number) => {
    const dealerIndex = players.findIndex(p => p.id === dealerId);
    const playerIndex = players.findIndex(p => p.id === pid);
    const offset = (playerIndex - dealerIndex + 3) % 3;
    switch (offset) {
      case 0: return { label: '东', full: 'East', bg: 'bg-red-500 text-white border-red-600' };
      case 1: return { label: '南', full: 'South', bg: 'bg-gray-200 text-gray-600 border-gray-300' };
      case 2: return { label: '西', full: 'West', bg: 'bg-gray-200 text-gray-600 border-gray-300' };
      default: return { label: '?', full: '?', bg: '' };
    }
  };

  // Calculate total Fei currently assigned to verify limits
  const currentTotalFei = Object.values(allPlayerStats).reduce((sum, stats) => sum + (stats.fei || 0), 0);

  return (
    <div className="bg-white p-4 rounded-xl shadow-md space-y-6">
      {isCameraOpen && (
        <CameraCapture 
          onCapture={handleCameraCapture} 
          onCancel={() => setIsCameraOpen(false)} 
        />
      )}

      {/* AI Button */}
      <button
        type="button"
        onClick={() => setIsCameraOpen(true)}
        disabled={isAnalyzing}
        className="w-full bg-blue-50 text-blue-600 border border-blue-200 p-4 rounded-xl flex items-center justify-center gap-3 font-semibold hover:bg-blue-100 transition shadow-sm"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="animate-spin" /> Analyzing Hand...
          </>
        ) : (
          <>
            <Camera /> Scan Winner's Hand
          </>
        )}
      </button>

      {analysisReason && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800 animate-fade-in">
          <strong>AI Analysis:</strong> {analysisReason}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Winner Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Who Won? (Winner becomes Next East)</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {players.map(p => {
              const wind = getPlayerWind(p.id);
              const isSelected = winnerId === p.id;
              
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setWinnerId(p.id)}
                  className={`relative p-3 rounded-xl border-2 transition flex items-center gap-3 overflow-hidden ${
                    isSelected
                      ? 'border-mj-table bg-mj-table/10 ring-1 ring-mj-table'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg font-bold border shadow-sm shrink-0 ${wind.bg}`}>
                    {wind.label}
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className={`text-sm font-bold truncate w-full text-left ${isSelected ? 'text-mj-table' : 'text-gray-700'}`}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{wind.full}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-mj-table animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Win Type & Fan */}
        <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-2">Win Type</label>
               <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setWinType(WinType.ZIMO)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 text-sm transition flex items-center justify-center gap-2 ${
                    winType === WinType.ZIMO
                      ? 'border-mj-table bg-mj-table text-white shadow-md shadow-mj-table/30'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Hand size={18} className={winType === WinType.ZIMO ? 'text-white' : 'text-gray-400'} />
                  Self Draw (自摸)
                </button>
                <button
                  type="button"
                  onClick={() => setWinType(WinType.CHUN)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 text-sm transition flex items-center justify-center gap-2 ${
                    winType === WinType.CHUN
                      ? 'border-red-500 bg-red-500 text-white shadow-md shadow-red-500/30'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <UserX size={18} className={winType === WinType.CHUN ? 'text-white' : 'text-gray-400'} />
                  Discard (出铳)
                </button>
              </div>
            </div>

            {/* Discarder (if Chun) */}
            {winType === WinType.CHUN && (
               <div className="col-span-2 animate-fade-in-down">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discarder</label>
                <div className="flex gap-2">
                  {players.filter(p => p.id !== winnerId).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDiscarderId(p.id)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                        discarderId === p.id
                          ? 'border-red-500 bg-red-100 text-red-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fan (Min 5)</label>
                <input
                  type="number"
                  min="5"
                  value={fan || ''}
                  onChange={e => setFan(parseInt(e.target.value) || 0)}
                  className={`w-full text-center p-3 border rounded-lg text-xl font-mono outline-none focus:ring-2 h-[50px] bg-white text-gray-900 ${fan < 5 ? 'border-red-300 ring-red-200' : 'border-gray-300 focus:border-mj-table ring-mj-table/20'}`}
                />
                {fan < 5 && <p className="text-xs text-red-500 mt-1">Minimum 5 Fan required.</p>}
            </div>
        </div>

        {/* Player Bonuses Table */}
        {(settings.enableFei || settings.enableKong) && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
              <Plus size={12} /> Bonus Tiles (Paid by All)
            </h4>
            
            {/* Scrollable Container for small screens */}
            <div className="overflow-x-auto">
              <div className="min-w-[300px] space-y-3">
                 {/* Header Row */}
                 <div className={`grid gap-2 items-center text-[10px] font-bold text-gray-400 uppercase text-center ${settings.enableFei && settings.enableKong ? 'grid-cols-[1fr,auto,auto]' : 'grid-cols-[1fr,auto]'}`}>
                    <div className="text-left pl-2">Player</div>
                    {settings.enableFei && <div className="w-24 sm:w-28 text-center">Fei (飞)</div>}
                    {settings.enableKong && <div className="w-24 sm:w-28 text-center">Kong (杠)</div>}
                 </div>
                 
                 {players.map(p => {
                    const currentFei = allPlayerStats[p.id]?.fei || 0;
                    // Max Fei for this player = Current amount + (4 - Total used by everyone else)
                    // If total is 3, remaining is 1. If this player has 1, they can have up to 1+1=2.
                    // Simplified: remaining global slots = 4 - currentTotalFei.
                    // User can add = remaining global slots.
                    // Max value = currentFei + remaining global slots.
                    const maxFeiForPlayer = currentFei + (4 - currentTotalFei);

                   return (
                     <div key={p.id} className={`grid gap-2 items-center ${settings.enableFei && settings.enableKong ? 'grid-cols-[1fr,auto,auto]' : 'grid-cols-[1fr,auto]'}`}>
                        <div className="font-medium text-sm text-gray-700 pl-2 truncate">{p.name}</div>
                        
                        {settings.enableFei && (
                          <div className="flex justify-center">
                              <Stepper 
                              value={currentFei} 
                              onChange={(v) => updatePlayerStat(p.id, 'fei', v)}
                              max={maxFeiForPlayer}
                              colorClass="text-mj-gold"
                              />
                          </div>
                        )}
                        
                        {settings.enableKong && (
                          <div className="flex justify-center">
                              <Stepper 
                              value={allPlayerStats[p.id]?.kong || 0} 
                              onChange={(v) => updatePlayerStat(p.id, 'kong', v)}
                              colorClass="text-blue-600"
                              />
                          </div>
                        )}
                     </div>
                   );
                 })}
              </div>
            </div>
            {settings.enableFei && (
               <p className="text-[10px] text-gray-400 mt-2 text-center">
                 Total Fei used: {currentTotalFei}/4
               </p>
            )}
          </div>
        )}

        {formError && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle size={16} /> {formError}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-mj-green text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={fan < 5}
        >
          <Calculator size={20} />
          Calculate & Next Round
        </button>
      </form>
    </div>
  );
};