import React, { useState, useEffect } from 'react';
import { Player, WinType, GameSettings, HandAnalysis, PlayerBonusStats } from '../types';
import { Camera, Calculator, Loader2, Plus, Minus, Hand, UserX, Target, Zap, Layers } from 'lucide-react';
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
    discarderId?: number,
    loserFans?: Record<number, number>
  ) => void;
  getWind: (pid: number) => string;
}

const Stepper = ({ value, onChange, max, colorClass = "text-gray-900", label }: { value: number, onChange: (v: number) => void, max?: number, colorClass?: string, label?: string }) => (
  <div className="flex flex-col items-center gap-1">
    {label && <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</span>}
    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-10 w-28 bg-white shadow-sm shrink-0">
      <button 
        type="button" 
        onClick={(e) => {
          e.preventDefault();
          onChange(Math.max(0, value - 1));
        }}
        className="w-9 h-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center border-r border-gray-100 active:bg-gray-200 text-gray-500 transition-colors"
      >
        <Minus size={14} />
      </button>
      <div className="flex-1 h-full flex items-center justify-center bg-white">
          <span className={`text-base font-bold font-mono ${colorClass}`}>{value}</span>
      </div>
      <button 
        type="button" 
        onClick={(e) => {
          e.preventDefault();
          if (max !== undefined && value >= max) return;
          onChange(value + 1);
        }}
        className={`w-9 h-full flex items-center justify-center border-l border-gray-100 transition-colors ${max !== undefined && value >= max ? 'bg-gray-100 text-gray-200 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-500'}`}
        disabled={max !== undefined && value >= max}
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);

export const ScoringForm: React.FC<Props> = ({ players, settings, dealerId, onCalculate, getWind }) => {
  const [winnerId, setWinnerId] = useState<number>(dealerId);
  const [winType, setWinType] = useState<WinType>(WinType.ZIMO);
  const [discarderId, setDiscarderId] = useState<number | undefined>(undefined);
  const [fan, setFan] = useState<number>(5);
  
  const [allPlayerStats, setAllPlayerStats] = useState<Record<number, PlayerBonusStats>>({});
  const [loserFans, setLoserFans] = useState<Record<number, number>>({});

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReason, setAnalysisReason] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    const initialStats: Record<number, PlayerBonusStats> = {};
    const initialLoserFans: Record<number, number> = {};
    players.forEach(p => {
      initialStats[p.id] = { fei: 0, selfKongs: 0, discardedKongs: {} };
      initialLoserFans[p.id] = 0;
    });
    setAllPlayerStats(initialStats);
    setLoserFans(initialLoserFans);
  }, [players]);

  useEffect(() => {
    setWinnerId(dealerId);
  }, [dealerId]);

  const updatePlayerStat = (pid: number, field: keyof PlayerBonusStats, val: any) => {
    setAllPlayerStats(prev => ({
      ...prev,
      [pid]: {
        ...prev[pid],
        [field]: val
      }
    }));
  };

  const toggleDiscardedKong = (receiverId: number, donorId: number) => {
    setAllPlayerStats(prev => {
        const stats = prev[receiverId];
        if (!stats) return prev;
        
        const discarded = { ...stats.discardedKongs };
        const currentCount = discarded[donorId] || 0;
        
        // Simple cycle 0 -> 1 -> 2 -> 0 for discarded kongs per player
        discarded[donorId] = (currentCount + 1) % 4; 
        
        if (discarded[donorId] === 0) delete discarded[donorId];
        
        return { ...prev, [receiverId]: { ...stats, discardedKongs: discarded } };
    });
  };

  const handleCameraCapture = async (imageSrc: string) => {
    setIsCameraOpen(false);
    setIsAnalyzing(true);
    try {
      const result: HandAnalysis = await analyzeHandImage(imageSrc);
      setFan(Math.max(5, result.fan));
      setAllPlayerStats(prev => ({
        ...prev,
        [winnerId]: {
          ...prev[winnerId],
          fei: result.feiCount,
          selfKongs: result.kongCount
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
    if (fan < 5) {
      setFormError('Winner Fan must be at least 5.');
      return;
    }
    onCalculate(winnerId, fan, allPlayerStats, winType, discarderId, loserFans);
    
    setFan(5);
    setAnalysisReason('');
    const resetStats: Record<number, PlayerBonusStats> = {};
    const resetLoserFans: Record<number, number> = {};
    players.forEach(p => {
        resetStats[p.id] = { fei: 0, selfKongs: 0, discardedKongs: {} };
        resetLoserFans[p.id] = 0;
    });
    setAllPlayerStats(resetStats);
    setLoserFans(resetLoserFans);
    setFormError('');
  };

  const currentTotalFei = (Object.values(allPlayerStats) as PlayerBonusStats[]).reduce((sum, s) => sum + (s.fei || 0), 0);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setIsCameraOpen(true)}
        disabled={isAnalyzing}
        className="w-full bg-white text-blue-600 border border-blue-100 p-6 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-blue-50 transition shadow-sm"
      >
        {isAnalyzing ? <Loader2 className="animate-spin" /> : <Camera />} Scan Winner's Hand
      </button>

      {analysisReason && <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl text-sm text-yellow-800 font-medium">{analysisReason}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Who Won Section */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-500 px-1">Who Won? (Winner becomes Next East)</label>
          <div className="space-y-2">
            {players.map(p => {
              const wind = getWind(p.id);
              const isSelected = winnerId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setWinnerId(p.id)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left relative overflow-hidden ${isSelected ? 'border-mj-table bg-white ring-4 ring-mj-table/5' : 'border-gray-100 bg-white text-gray-400'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${wind === '东' ? 'bg-mj-red' : isSelected ? 'bg-mj-table' : 'bg-gray-200'}`}>
                    {wind}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-bold text-base ${isSelected ? 'text-mj-table' : 'text-gray-900 opacity-60'}`}>{p.name}</span>
                    <span className="text-[10px] uppercase font-black tracking-widest opacity-40">
                      {wind === '东' ? 'EAST' : wind === '南' ? 'SOUTH' : 'WEST'}
                    </span>
                  </div>
                  {isSelected && <div className="absolute right-4 w-2 h-2 rounded-full bg-mj-table" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Win Type & Fan Section */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-500 px-1">Win Type</label>
          <div className="flex gap-3">
            <button
                type="button"
                onClick={() => setWinType(WinType.ZIMO)}
                className={`flex-1 py-4 rounded-2xl font-black text-sm border-2 transition flex items-center justify-center gap-2 shadow-sm ${winType === WinType.ZIMO ? 'border-mj-table bg-mj-table text-white shadow-mj-table/20' : 'border-gray-100 bg-white text-gray-400'}`}
            >
                <Hand size={18} /> Self Draw (自摸)
            </button>
            <button
                type="button"
                onClick={() => setWinType(WinType.CHUN)}
                className={`flex-1 py-4 rounded-2xl font-black text-sm border-2 transition flex items-center justify-center gap-2 shadow-sm ${winType === WinType.CHUN ? 'border-mj-table bg-white text-mj-table ring-4 ring-mj-table/5' : 'border-gray-100 bg-white text-gray-400'}`}
            >
                <UserX size={18} /> Discard (出铳)
            </button>
          </div>

          {winType === WinType.CHUN && (
            <div className="animate-fade-in-down bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3">Who Discarded Hand Tile?</label>
                <div className="flex gap-2">
                    {players.filter(p => p.id !== winnerId).map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setDiscarderId(p.id)}
                            className={`flex-1 py-3 rounded-xl text-xs font-black border transition ${discarderId === p.id ? 'border-mj-table bg-white text-mj-table shadow-sm' : 'border-gray-200 bg-white text-gray-400'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>
          )}
          
          <div className="flex flex-col">
              <label className="block text-sm font-bold text-gray-500 px-1 mb-2 uppercase tracking-widest text-[10px]">Fan (Min 5)</label>
              <input
                type="number"
                min="5"
                value={fan || ''}
                onFocus={(e) => e.target.select()}
                onChange={e => setFan(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-center p-4 border border-gray-200 bg-white rounded-2xl text-2xl font-mono font-black focus:ring-4 focus:ring-mj-table/5 focus:border-mj-table outline-none transition-all shadow-sm"
                placeholder="5"
              />
          </div>
        </div>

        {/* Loser Settlement Section */}
        <div className="bg-mj-table/5 p-5 rounded-2xl border border-mj-table/10 space-y-4">
             <h4 className="text-xs font-black text-mj-table uppercase flex items-center gap-2 tracking-widest">
                <Target size={14} /> Loser Settlement
             </h4>
             <div className="grid grid-cols-2 gap-4">
                 {players.filter(p => p.id !== winnerId).map(p => (
                     <div key={p.id} className="space-y-1.5">
                         <label className="block text-[10px] text-gray-500 uppercase font-black truncate">{p.name}'s Fan</label>
                         <input 
                            type="number"
                            min="0"
                            value={loserFans[p.id] || 0}
                            onFocus={(e) => e.target.select()}
                            onChange={e => setLoserFans({...loserFans, [p.id]: Math.max(0, parseInt(e.target.value) || 0)})}
                            className="w-full border border-gray-200 bg-white rounded-xl p-3 text-center text-sm font-mono font-bold focus:ring-4 focus:ring-mj-table/5 outline-none shadow-sm"
                         />
                     </div>
                 ))}
             </div>
             <p className="text-[10px] text-gray-400 italic">Rule: Highest fan loser collects their OWN fan value from the other loser if Fan ≥ 5.</p>
        </div>

        {/* Bonus Tiles Section */}
        {(settings.enableFei || settings.enableKong) && (
          <div className="space-y-4">
              <h4 className="text-sm font-black text-gray-500 uppercase flex items-center gap-2 border-b border-gray-100 pb-3 tracking-widest">Bonus Tiles (Fei / Kong)</h4>
              {players.map(p => {
                  const stats = allPlayerStats[p.id] || { fei: 0, selfKongs: 0, discardedKongs: {} };
                  const wind = getWind(p.id);
                  // Fixed potential TypeScript error by casting Object.values results to number[] to avoid 'unknown' type in comparison
                  const hasAnyDiscardedKongs = (Object.values(stats.discardedKongs) as number[]).some(c => c > 0);
                  
                  return (
                      <div key={p.id} className="space-y-4 p-5 bg-white border border-gray-100 rounded-3xl shadow-sm">
                          <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${wind === '东' ? 'bg-mj-red' : 'bg-gray-200 text-gray-500'}`}>
                                  {wind}
                                </div>
                                <span className="text-sm font-black text-gray-900">{p.name}</span>
                              </div>
                              <div className="flex gap-4">
                                  {settings.enableFei && (
                                    <Stepper 
                                        label="Fei"
                                        value={stats.fei} 
                                        onChange={v => updatePlayerStat(p.id, 'fei', v)} 
                                        max={stats.fei + (4 - currentTotalFei)}
                                        colorClass="text-mj-gold"
                                    />
                                  )}
                                  {settings.enableKong && (
                                    <Stepper 
                                        label="Self Kong"
                                        value={stats.selfKongs} 
                                        onChange={v => updatePlayerStat(p.id, 'selfKongs', v)} 
                                        colorClass="text-blue-600"
                                    />
                                  )}
                              </div>
                          </div>

                          {/* Kong Discarded Section - Only show if enabled AND user has at least one discarded kong indicated OR it's a prominent option */}
                          {settings.enableKong && (
                              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                  <span className="block text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest flex items-center gap-1">
                                    <Layers size={10} /> Discarded Kongs (From Others):
                                  </span>
                                  <div className="flex gap-2">
                                      {players.filter(other => other.id !== p.id).map(other => {
                                          const count = stats.discardedKongs[other.id] || 0;
                                          return (
                                              <button
                                                  key={other.id}
                                                  type="button"
                                                  onClick={() => toggleDiscardedKong(p.id, other.id)}
                                                  className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition flex items-center justify-center gap-2 ${count > 0 ? 'bg-mj-table border-mj-table text-white shadow-sm' : 'bg-white text-gray-400 border-gray-200'}`}
                                              >
                                                  {other.name} {count > 0 && <span className="bg-white/20 px-1.5 rounded">{count}</span>}
                                              </button>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
        )}

        {formError && <div className="text-mj-red text-xs text-center font-bold bg-mj-red/5 p-3 rounded-2xl border border-mj-red/10">{formError}</div>}

        <button
          type="submit"
          className="w-full bg-mj-green text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-mj-green/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 hover:bg-emerald-800"
        >
          <Calculator size={22} /> Calculate Round
        </button>
      </form>
    </div>
  );
};