import React, { useState } from 'react';
import { LamiPlayer, LamiGameSettings, LamiRoundInput } from '../types';
import { Calculator, Check, AlertCircle, Minus, Plus, Sparkles } from 'lucide-react';

interface Props {
  players: LamiPlayer[];
  settings: LamiGameSettings;
  onCalculate: (inputs: LamiRoundInput[], isCleared: boolean) => void;
}

const Stepper = ({ 
  value, 
  onChange, 
  max, 
  colorClass = "text-gray-900" 
}: { 
  value: number, 
  onChange: (v: number) => void, 
  max?: number, 
  colorClass?: string 
}) => (
  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-9 w-20 bg-white shadow-sm shrink-0">
    <button 
      type="button" 
      onClick={(e) => {
        e.preventDefault();
        onChange(Math.max(0, value - 1));
      }}
      className="w-7 h-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center border-r border-gray-200 active:bg-gray-200 text-gray-500 transition-colors"
    >
      <Minus size={14} />
    </button>
    <div className="flex-1 h-full flex items-center justify-center bg-white relative">
        <span className={`text-xs font-bold font-mono ${colorClass}`}>{value}</span>
    </div>
    <button 
      type="button" 
      onClick={(e) => {
        e.preventDefault();
        if (max !== undefined && value >= max) return;
        onChange(value + 1);
      }}
      className={`w-7 h-full flex items-center justify-center border-l border-gray-200 transition-colors ${max !== undefined && value >= max ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-500'}`}
      disabled={max !== undefined && value >= max}
    >
      <Plus size={14} />
    </button>
  </div>
);

export const LamiScoringForm: React.FC<Props> = ({ players, settings, onCalculate }) => {
  const [inputs, setInputs] = useState<Record<number, LamiRoundInput>>(() => {
    const init: Record<number, LamiRoundInput> = {};
    players.forEach((p, idx) => {
        init[p.id] = { playerId: p.id, points: 0, jokerCount: 0, aceCount: 0, hasFullAceSuits: false, suitPriority: idx + 1 };
    });
    return init;
  });
  const [isCleared, setIsCleared] = useState(false);

  const currentInputs = Object.values(inputs) as LamiRoundInput[];

  // Identify point ties
  const pointCounts: Record<number, number> = {};
  currentInputs.forEach(input => {
    pointCounts[input.points] = (pointCounts[input.points] || 0) + 1;
  });
  const tiedPointsSet = new Set(
    Object.keys(pointCounts)
      .filter(p => pointCounts[Number(p)] > 1)
      .map(Number)
  );

  // Global limits calculation
  const totalJokers = currentInputs.reduce((sum, inp) => sum + inp.jokerCount, 0);
  const totalAces = currentInputs.reduce((sum, inp) => sum + inp.aceCount, 0);

  // Priority conflicts
  const collisionMap: Record<string, number[]> = {};
  currentInputs.forEach(input => {
    const key = `${input.points}-${input.suitPriority}`;
    if (!collisionMap[key]) collisionMap[key] = [];
    collisionMap[key].push(input.playerId);
  });

  const conflictPlayerIds = new Set(
    Object.values(collisionMap)
      .filter(ids => ids.length > 1)
      .flat()
  );

  const sortedPlayers = [...players].sort((a, b) => {
    const pA = inputs[a.id]?.points || 0;
    const pB = inputs[b.id]?.points || 0;
    if (pA !== pB) return pA - pB;
    return (inputs[a.id]?.suitPriority || 99) - (inputs[b.id]?.suitPriority || 99);
  });

  const currentWinner = sortedPlayers[0];

  const updateInput = (pid: number, field: keyof LamiRoundInput, value: any) => {
    setInputs(prev => ({
        ...prev,
        [pid]: { 
            ...prev[pid], 
            [field]: value,
            // Reset "hasFullAceSuits" if ace count drops below 4
            ...(field === 'aceCount' && value < 4 ? { hasFullAceSuits: false } : {})
        }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(currentInputs, isCleared);
    
    const reset: Record<number, LamiRoundInput> = {};
    players.forEach((p, idx) => {
        reset[p.id] = { playerId: p.id, points: 0, jokerCount: 0, aceCount: 0, hasFullAceSuits: false, suitPriority: idx + 1 };
    });
    setInputs(reset);
    setIsCleared(false);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md space-y-4 relative z-0">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center mb-4">
         <span className="text-xs text-blue-500 uppercase font-bold tracking-wider">Current Projected Winner</span>
         <div className="text-lg font-bold text-blue-800 flex items-center justify-center gap-2">
            {currentWinner.name}
            {isCleared && <span className="text-xs bg-yellow-400 text-yellow-900 px-2 rounded-full shadow-sm ml-1 animate-pulse">Cleared Hand!</span>}
         </div>
         {conflictPlayerIds.size > 0 && (
           <p className="text-[10px] text-orange-500 font-bold mt-1 flex items-center justify-center gap-1 animate-bounce">
             <AlertCircle size={10} /> Duplicate Priority detected!
           </p>
         )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
            {players.map(p => {
                const input = inputs[p.id];
                const isWinner = currentWinner.id === p.id;
                const isTied = tiedPointsSet.has(input.points);
                const hasConflict = conflictPlayerIds.has(p.id);

                return (
                    <div key={p.id} className={`flex flex-col gap-3 p-3 rounded-xl border transition-all ${isWinner ? 'border-blue-400 bg-blue-50/50 shadow-sm' : 'border-gray-100 bg-white'} ${hasConflict ? 'border-orange-300 bg-orange-50' : ''}`}>
                        {/* Header: Player Name & Suit Priority */}
                        <div className="flex justify-between items-center">
                            <div className="min-w-0">
                                <div className="font-bold text-sm truncate text-gray-800 flex items-center gap-2">
                                    {p.name}
                                    {input.hasFullAceSuits && <Sparkles size={12} className="text-orange-500" />}
                                </div>
                                {hasConflict && <div className="text-[8px] text-orange-500 font-bold uppercase">Priority Conflict</div>}
                                {!hasConflict && isTied && <div className="text-[8px] text-blue-500 font-bold uppercase">Point Tie</div>}
                            </div>

                            <div className="flex items-center gap-2">
                                {isTied ? (
                                    <div className="w-20">
                                        <div className="flex items-center gap-1 border border-blue-200 rounded-lg p-1 bg-white">
                                            <span className="text-[8px] text-blue-400 font-bold uppercase shrink-0">Suit Pri</span>
                                            <select 
                                                value={input.suitPriority}
                                                onChange={(e) => updateInput(p.id, 'suitPriority', parseInt(e.target.value))}
                                                className="w-full text-center text-xs font-bold outline-none bg-transparent"
                                            >
                                                {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-[8px] text-gray-300 uppercase font-bold border border-gray-100 rounded px-1.5 py-0.5">
                                        Pri {input.suitPriority}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Controls Row: Balanced Layout */}
                        <div className="grid grid-cols-[1fr,auto,auto] gap-2 items-end">
                            <div className="min-w-0">
                                <label className="block text-[9px] text-gray-400 uppercase mb-0.5 font-bold">Points</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    value={input.points}
                                    onFocus={(e) => e.target.select()}
                                    onChange={e => updateInput(p.id, 'points', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full border border-gray-300 bg-white rounded-lg p-2 text-center font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none h-9"
                                />
                            </div>

                            {settings.enableJoker && (
                                <div className="flex flex-col items-center">
                                    <label className="block text-[9px] text-gray-400 uppercase mb-0.5 font-bold">Joker</label>
                                    <Stepper 
                                        value={input.jokerCount} 
                                        onChange={(v) => updateInput(p.id, 'jokerCount', v)}
                                        max={input.jokerCount + (8 - totalJokers)}
                                        colorClass="text-blue-600"
                                    />
                                </div>
                            )}

                            {settings.enableAce && (
                                <div className="flex flex-col items-center">
                                    <label className="block text-[9px] text-gray-400 uppercase mb-0.5 font-bold">Ace</label>
                                    <Stepper 
                                        value={input.aceCount} 
                                        onChange={(v) => updateInput(p.id, 'aceCount', v)}
                                        max={input.aceCount + (8 - totalAces)}
                                        colorClass="text-red-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Special Options: All 4 suits doubling (Appears at 4 or more Aces) */}
                        {input.aceCount >= 4 && (
                            <div className="animate-fade-in-up">
                                <button
                                    type="button"
                                    onClick={() => updateInput(p.id, 'hasFullAceSuits', !input.hasFullAceSuits)}
                                    className={`w-full py-1.5 rounded-lg border flex items-center justify-center gap-2 text-[10px] font-bold transition-all shadow-sm ${
                                        input.hasFullAceSuits 
                                        ? 'bg-orange-500 border-orange-600 text-white' 
                                        : 'bg-orange-50 border-orange-200 text-orange-700'
                                    }`}
                                >
                                    <Sparkles size={12} />
                                    {input.hasFullAceSuits ? 'Bonus: All 4 Suits Active (x2)' : 'Confirm All 4 Suits?'}
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        <div className="flex flex-col gap-2 pt-2">
            {(totalJokers >= 8 || totalAces >= 8) && (
                <div className="text-[10px] text-orange-600 text-center font-bold flex items-center justify-center gap-1 mb-1 bg-orange-50 py-1 rounded">
                    <AlertCircle size={10} /> Limit: Max 8 Jokers & 8 Aces per game
                </div>
            )}
            
            <button
                type="button"
                onClick={() => setIsCleared(!isCleared)}
                className={`w-full py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition ${
                    isCleared ? 'border-yellow-400 bg-yellow-50 text-yellow-700 shadow-inner' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                }`}
            >
                <Check size={18} className={isCleared ? 'opacity-100' : 'opacity-0'} />
                Winner Cleared Hand
            </button>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={conflictPlayerIds.size > 0}
            >
              <Calculator size={20} />
              Calculate Round
            </button>
        </div>
      </form>
    </div>
  );
};