import React from 'react';
import { GameSettings, Player } from '../types';
import { X, Users, DollarSign, Zap, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
}

export const SettingsModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave, 
  players, 
  onUpdatePlayers 
}) => {
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [localPlayers, setLocalPlayers] = React.useState(players);
  // We use a string state for the input to properly handle decimal typing (e.g. "0.")
  const [baseValueInput, setBaseValueInput] = React.useState(settings.baseValue.toString());

  React.useEffect(() => {
    setLocalSettings(settings);
    setBaseValueInput(settings.baseValue.toString());
    setLocalPlayers(players);
  }, [settings, players, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Parse the input string back to number on save and ensure non-negative
    const parsedBaseValue = Math.max(0, parseFloat(baseValueInput) || 0);
    
    onSave({
      ...localSettings,
      baseValue: parsedBaseValue
    });
    onUpdatePlayers(localPlayers);
    onClose();
  };

  const handleNameChange = (id: number, newName: string) => {
    setLocalPlayers(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-mj-green p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <SettingsIcon /> Game Settings
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
          
          {/* Player Names Section */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Users size={16} /> Players
            </h3>
            <div className="grid gap-3">
              {localPlayers.map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs font-mono w-6">P{player.id}</span>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handleNameChange(player.id, e.target.value)}
                    placeholder={`Player ${player.id}`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-mj-table outline-none bg-white text-gray-900"
                  />
                </div>
              ))}
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Scoring Rules Section */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} /> Scoring Rules
            </h3>
            
            {/* Base Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per 1 Fan (RM)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 font-bold">RM</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={baseValueInput}
                  onChange={(e) => setBaseValueInput(e.target.value)}
                  onBlur={() => {
                    const val = Math.max(0, parseFloat(baseValueInput) || 0);
                    setBaseValueInput(val.toString());
                  }}
                  className="w-full border border-gray-300 rounded-lg pl-10 p-3 text-lg font-mono focus:ring-2 focus:ring-mj-table outline-none bg-white text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Accepts decimals (e.g. 0.10 for 10 sen)</p>
            </div>

            {/* Burst Fan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Burst Limit (爆番)
              </label>
              <div className="flex items-center gap-4">
                 <input
                  type="number"
                  min="0"
                  value={localSettings.burstFan}
                  onChange={(e) => setLocalSettings({ ...localSettings, burstFan: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-24 border border-gray-300 rounded-lg p-3 text-lg font-mono text-center focus:ring-2 focus:ring-mj-table outline-none bg-white text-gray-900"
                />
                <p className="text-xs text-gray-500 flex-1">
                  Score doubles if Fan reaches this limit.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Special Tiles</label>
              
              {/* Fei Toggle */}
              <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-mj-gold shadow-sm">
                    <Zap size={18} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900">Enable Fei (飞)</label>
                    <p className="text-[10px] text-gray-500">Pays 2 × Base Value per tile</p>
                  </div>
                </div>
                <Toggle 
                  checked={localSettings.enableFei} 
                  onChange={() => setLocalSettings({ ...localSettings, enableFei: !localSettings.enableFei })} 
                />
              </div>

              {/* Kong Toggle */}
              <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-blue-500 shadow-sm">
                    <Layers size={18} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900">Enable Kong (杠)</label>
                    <p className="text-[10px] text-gray-500">Pays 2 × Base Value per set</p>
                  </div>
                </div>
                <Toggle 
                  checked={localSettings.enableKong} 
                  onChange={() => setLocalSettings({ ...localSettings, enableKong: !localSettings.enableKong })} 
                />
              </div>
            </div>

          </section>

          <button
            onClick={handleSave}
            className="w-full bg-mj-green text-white font-bold py-3.5 rounded-xl hover:bg-emerald-800 active:scale-[0.98] transition shadow-lg shadow-mj-green/20"
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
    className={`w-12 h-7 flex items-center rounded-full p-1 duration-300 shadow-inner ${
      checked ? 'bg-mj-table' : 'bg-gray-300'
    }`}
  >
    <div
      className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ${
        checked ? 'translate-x-5' : ''
      }`}
    />
  </button>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);