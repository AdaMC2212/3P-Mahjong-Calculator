
import React from 'react';
import { LayoutGrid, Spade, Users } from 'lucide-react';

interface Props {
  onSelect: (mode: 'mahjong' | 'lami') => void;
}

export const LandingPage: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Game Calculator</h1>
        <p className="text-gray-500 font-medium">Select a game to start scoring</p>
      </div>

      <div className="grid gap-6 w-full max-w-sm">
        {/* 3P Mahjong Card */}
        <button
          onClick={() => onSelect('mahjong')}
          className="group relative bg-white p-6 rounded-3xl shadow-xl border-2 border-transparent hover:border-mj-green transition-all duration-300 overflow-hidden active:scale-95"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <LayoutGrid size={120} className="text-mj-green" />
          </div>
          <div className="relative z-10 text-left space-y-4">
            <div className="w-12 h-12 bg-mj-green rounded-2xl flex items-center justify-center text-white shadow-lg shadow-mj-green/30">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">3P Mahjong</h2>
              <p className="text-sm text-gray-500">Malaysia 3-Player Rules</p>
            </div>
          </div>
        </button>

        {/* Lami Mahjong Card */}
        <button
          onClick={() => onSelect('lami')}
          className="group relative bg-white p-6 rounded-3xl shadow-xl border-2 border-transparent hover:border-blue-600 transition-all duration-300 overflow-hidden active:scale-95"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <Spade size={120} className="text-blue-600" />
          </div>
          <div className="relative z-10 text-left space-y-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <Spade size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Lami Mahjong</h2>
              <p className="text-sm text-gray-500">4-Player Ranking & Sides</p>
            </div>
          </div>
        </button>
      </div>

      <footer className="pt-8 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
        Scoring Assistant v2.0
      </footer>
    </div>
  );
};
