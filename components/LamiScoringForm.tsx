import React, { useState } from 'react';
import { LamiPlayer, LamiGameSettings, LamiRoundInput } from '../types';
import { Calculator, Check, AlertCircle } from 'lucide-react';

interface Props {
  players: LamiPlayer[];
  settings: LamiGameSettings;
  onCalculate: (inputs: LamiRoundInput[], isCleared: boolean) => void;
}

export const LamiScoringForm: React.FC<Props> = ({ players, settings, onCalculate }) => {
  const [inputs, setInputs] = useState<Record<number, LamiRoundInput>>(() => {
    const init: Record<number, LamiRoundInput> = {};
    players.forEach((p, idx) => {
        init[p.id] = { playerId: p.id, points: 0, jokerCount: 0, aceCount: 0, suitPriority: idx + 1 };
    });
    return init;
  });
  const [isCleared, setIsCleared] = useState(false);

  // Identify point ties to determine if suit priority selection is needed
  const pointCounts: Record<number, number> = {};
  Object.values(inputs).forEach(input => {
    pointCounts[input.points] = (pointCounts[input.points] || 0) + 1;
  });
  const tiedPointsSet = new Set(
    Object.keys(pointCounts)
      .filter(p => pointCounts[Number(p)] > 1)
      .map(Number)
  );

  // Group inputs by points AND priority to find TRUE ties (conflicts)
  const collisionMap: Record<string, number[]> = {};
  Object.values(inputs).forEach(input => {
    const key = `${input.points}-${input.suitPriority}`;
    if (!collisionMap[key]) collisionMap[key] = [];
    collisionMap[key].push(input.playerId);
  });

  const conflictPlayerIds = new Set(
    Object.values(collisionMap)
      .filter(ids => ids.length > 1)
      .flat()
  );

  // Helper to determine winner dynamically
  const sortedPlayers = [...players].sort((a, b) => {
    const pA = inputs[a.id]?.points || 0;
    const pB = inputs[b.id]?.points || 0;
    if (pA !== pB) return pA - pB;
    return (inputs[a.id]?.suitPriority || 99) - (inputs[b.id]?.suitPriority || 99);
  });

  const currentWinner = sortedPlayers[0];

  const updateInput = (pid: number, field: keyof LamiRoundInput, value: number) => {
    setInputs(prev => ({
        ...prev,
        [pid]: { ...prev[pid], [field]: value }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(Object.values(inputs), isCleared);
    
    // Reset inputs but keep player keys
    const reset: Record<number, LamiRoundInput> = {};
    players.forEach((p, idx) => {
        reset[p.id] = { playerId: p.id, points: 0, jokerCount: 0, aceCount: 0, suitPriority: idx + 1 };
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
            {isCleared && <span className="text-xs bg-yellow-400 text-yellow-900 px-2 rounded-full shadow-sm">Cleared Hand!</span>}
         </div>
         {conflictPlayerIds.size > 0 && (
           <p className="text-[10px] text-orange-500 font-bold mt-1 flex items-center justify-center gap-1 animate-pulse">
             <AlertCircle size={10} /> Duplicate Priority detected! Change Suit Pri.
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
                    <div key={p.id} className={`grid grid-cols-[1fr,auto,1fr,auto,auto] gap-2 items-center p-2 rounded-lg border transition-all ${isWinner ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200'} ${hasConflict ? 'border-orange-300 bg-orange-50' : ''}`}>
                        <div className="min-w-0">
                            <div className="font-bold text-sm truncate">{p.name}</div>
                            {hasConflict && <div className="text-[9px] text-orange-500 font-bold uppercase">Conflict</div>}
                            {!hasConflict && isTied && <div className="text-[9px] text-blue-500 font-bold uppercase">Point Tie</div>}
                        </div>

                        {/* Suit Priority Picker - Only visible when points are tied */}
                        <div className="w-16 min-h-[40px] flex flex-col justify-center">
                            {isTied ? (
                                <>
                                    <label className="block text-[8px] text-gray-400 uppercase text-center mb-0.5 font-bold">Suit Pri</label>
                                    <select 
                                        value={input.suitPriority}
                                        onChange={(e) => updateInput(p.id, 'suitPriority', parseInt(e.target.value))}
                                        className={`w-full border bg-white rounded-lg p-1 text-center text-[10px] font-bold focus:ring-2 focus:ring-blue-500 outline-none ${hasConflict ? 'border-orange-500 text-orange-600' : 'border-gray-300'}`}
                                    >
                                        {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </>
                            ) : (
                                <div className="w-full text-center">
                                    <div className="text-[8px] text-gray-300 uppercase font-bold">Pri</div>
                                    <div className="text-[10px] text-gray-400 font-mono">{input.suitPriority}</div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[9px] text-gray-400 uppercase text-center mb-0.5 font-bold">Points</label>
                            <input
                                type="number"
                                value={input.points}
                                onChange={e => updateInput(p.id, 'points', parseInt(e.target.value) || 0)}
                                className="w-full border border-gray-300 bg-white rounded-lg p-1 text-center font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {settings.enableJoker && (
                            <div className="w-12">
                                <label className="block text-[9px] text-gray-400 uppercase text-center mb-0.5 font-bold">Jok</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={input.jokerCount}
                                    onChange={e => updateInput(p.id, 'jokerCount', parseInt(e.target.value) || 0)}
                                    className="w-full border border-gray-300 bg-white rounded-lg p-1 text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        )}

                        {settings.enableAce && (
                            <div className="w-12">
                                <label className="block text-[9px] text-gray-400 uppercase text-center mb-0.5 font-bold">Ace</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={input.aceCount}
                                    onChange={e => updateInput(p.id, 'aceCount', parseInt(e.target.value) || 0)}
                                    className="w-full border border-gray-300 bg-white rounded-lg p-1 text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        <button
            type="button"
            onClick={() => setIsCleared(!isCleared)}
            className={`w-full py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition ${
                isCleared ? 'border-yellow-400 bg-yellow-50 text-yellow-700 shadow-inner' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
            }`}
        >
            <Check size={18} className={isCleared ? 'opacity-100' : 'opacity-0'} />
            Winner Cleared Hand (Complete Set)
        </button>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={conflictPlayerIds.size > 0}
        >
          <Calculator size={20} />
          Calculate Round
        </button>
      </form>
    </div>
  );
};