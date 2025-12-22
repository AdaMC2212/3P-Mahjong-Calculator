import React, { useState, useEffect } from 'react';
import { LamiGameSettings, LamiPlayer } from '../types';
import { X, Users, DollarSign, Wand2, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: LamiGameSettings;
  onSave: (settings: LamiGameSettings) => void;
  players: LamiPlayer[];
  onUpdatePlayers: (players: LamiPlayer[]) => void;
}

export const LamiSettingsModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave, 
  players, 
  onUpdatePlayers 
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [localPlayers, setLocalPlayers] = useState(players);

  useEffect(() => {
    setLocalSettings(settings);
    setLocalPlayers(players);
  }, [settings, players, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (id: number, newName: string) => {
    setLocalPlayers(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handlePayTableChange = (index: number, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    const newTable = [...localSettings.basePayTable] as [number, number, number];
    newTable[index] = num;
    setLocalSettings({ ...localSettings, basePayTable: newTable });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            Lami Settings
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
          
          {/* Players */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Users size={16} /> Player Names
            </h3>
            <div className="grid gap-3">
              {localPlayers.map((player) => (
                <div key={player.id} className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs font-mono w-4">P{player.id}</span>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handleNameChange(player.id, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                    placeholder="Name"
                  />
                </div>
              ))}
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Main Payouts */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} /> Main Settlement
            </h3>
            <div className="grid grid-cols-3 gap-2">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Rank 2 Pays</label>
                  <input 
                    type="number" 
                    min="0"
                    value={localSettings.basePayTable[0]}
                    onChange={(e) => handlePayTableChange(0, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-center font-mono bg-white text-gray-900"
                  />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Rank 3 Pays</label>
                  <input 
                    type="number" 
                    min="0"
                    value={localSettings.basePayTable[1]}
                    onChange={(e) => handlePayTableChange(1, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-center font-mono bg-white text-gray-900"
                  />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Rank 4 Pays</label>
                  <input 
                    type="number" 
                    min="0"
                    value={localSettings.basePayTable[2]}
                    onChange={(e) => handlePayTableChange(2, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-center font-mono bg-white text-gray-900"
                  />
               </div>
            </div>
          </section>

          <section className="space-y-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
             <div className="flex items-center gap-2 text-yellow-800">
                <Sparkles size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Cleared Hand (Fix Price)</h3>
             </div>
             <div>
                <label className="block text-xs font-medium text-yellow-700 mb-1">Losers pay this fixed amount if Winner clears hand</label>
                <input 
                    type="number" 
                    min="0"
                    value={localSettings.clearHandFixedPrice}
                    onChange={(e) => setLocalSettings({ ...localSettings, clearHandFixedPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full border border-yellow-300 rounded-lg p-3 text-center font-mono font-bold text-lg bg-white text-yellow-900 focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="e.g. 5"
                />
             </div>
             <p className="text-[10px] text-yellow-600 italic">Overrides Rank payouts when Cleared Hand is active.</p>
          </section>

          <hr className="border-gray-100" />

          {/* Side Settlements */}
          <section className="space-y-4">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Wand2 size={16} /> Side Settlements
            </h3>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🃏</span>
                    <div>
                        <div className="text-sm font-bold">Joker Settlement</div>
                        <div className="text-xs text-gray-500">Diff × Unit Value</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                       type="number"
                       min="0"
                       value={localSettings.jokerUnitValue}
                       onChange={(e) => setLocalSettings({...localSettings, jokerUnitValue: Math.max(0, parseFloat(e.target.value) || 0)})}
                       className="w-16 border border-gray-300 rounded p-1 text-center text-sm bg-white text-gray-900"
                    />
                    <Toggle 
                        checked={localSettings.enableJoker} 
                        onChange={() => setLocalSettings({...localSettings, enableJoker: !localSettings.enableJoker})}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="text-lg text-red-500 font-bold">A</span>
                    <div>
                        <div className="text-sm font-bold">Ace Settlement</div>
                        <div className="text-xs text-gray-500">Diff × Unit Value</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                       type="number"
                       min="0"
                       value={localSettings.aceUnitValue}
                       onChange={(e) => setLocalSettings({...localSettings, aceUnitValue: Math.max(0, parseFloat(e.target.value) || 0)})}
                       className="w-16 border border-gray-300 rounded p-1 text-center text-sm bg-white text-gray-900"
                    />
                    <Toggle 
                        checked={localSettings.enableAce} 
                        onChange={() => setLocalSettings({...localSettings, enableAce: !localSettings.enableAce})}
                    />
                </div>
            </div>
          </section>

          <button
            onClick={() => {
                onSave(localSettings);
                onUpdatePlayers(localPlayers);
                onClose();
            }}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 ${
      checked ? 'bg-blue-500' : 'bg-gray-300'
    }`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
        checked ? 'translate-x-4' : ''
      }`}
    />
  </button>
);