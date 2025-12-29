
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
  const [baseValueInput, setBaseValueInput] = React.useState(settings.baseValue.toString());

  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setBaseValueInput(settings.baseValue.toString());
      setLocalPlayers(players);
    }
  }, [settings, players, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        <div className="bg-mj-green p-5 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-black flex items-center gap-3">
            Game Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
          <section className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={16} /> Players
            </h3>
            <div className="grid gap-3">
              {localPlayers.map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <span className="text-gray-400 text-[10px] font-black w-6">P{player.id}</span>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handleNameChange(player.id, e.target.value)}
                    placeholder={`Player ${player.id}`}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-mj-table/5 focus:border-mj-table outline-none bg-white text-gray-900 shadow-sm"
                  />
                </div>
              ))}
            </div>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={16} /> Scoring Rules
            </h3>
            
            <div>
              <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest px-1">
                Price per 1 Fan (RM)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-400 font-bold">RM</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={baseValueInput}
                  onChange={(e) => setBaseValueInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-2xl pl-12 p-4 text-xl font-mono font-black focus:ring-4 focus:ring-mj-table/5 focus:border-mj-table outline-none bg-white text-gray-900 shadow-sm"
                  placeholder="1.00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest px-1">Special Tiles</label>
              
              <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl text-mj-gold shadow-sm">
                    <Zap size={20} />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-900">Enable Fei (飞)</label>
                    <p className="text-[10px] text-gray-500 font-bold">Pays 2 × Base Value</p>
                  </div>
                </div>
                <Toggle 
                  checked={localSettings.enableFei} 
                  onChange={() => setLocalSettings(prev => ({ ...prev, enableFei: !prev.enableFei }))} 
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl text-blue-500 shadow-sm">
                    <Layers size={20} />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-900">Enable Kong (杠)</label>
                    <p className="text-[10px] text-gray-500 font-bold">Pays 2-4 × Base Value</p>
                  </div>
                </div>
                <Toggle 
                  checked={localSettings.enableKong} 
                  onChange={() => setLocalSettings(prev => ({ ...prev, enableKong: !prev.enableKong }))} 
                />
              </div>
            </div>
          </section>

          <button
            onClick={handleSave}
            className="w-full bg-mj-green text-white font-black py-4.5 rounded-3xl hover:bg-emerald-800 active:scale-[0.98] transition shadow-xl shadow-mj-green/20"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      onChange();
    }}
    className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner ${
      checked ? 'bg-mj-table' : 'bg-gray-300'
    }`}
  >
    <div
      className={`bg-white w-6 h-6 rounded-full shadow-lg transform transition-transform duration-300 ${
        checked ? 'translate-x-6' : ''
      }`}
    />
  </button>
);
