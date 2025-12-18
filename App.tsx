import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MahjongGame } from './components/MahjongGame.tsx';
import { LamiGame } from './components/LamiGame.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { Home } from 'lucide-react';

const App = () => {
  const [gameMode, setGameMode] = useState<'mahjong' | 'lami' | null>(null);

  if (!gameMode) {
    return <LandingPage onSelect={setGameMode} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10 font-sans flex flex-col">
      {/* Header with Game Switcher */}
      <header className={`p-4 sticky top-0 z-30 shadow-md transition-colors duration-300 ${gameMode === 'mahjong' ? 'bg-mj-green' : 'bg-blue-600'}`}>
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <div className="flex justify-between side-center text-white">
            <h1 className="text-xl font-bold tracking-tight">
              {gameMode === 'mahjong' ? '3P Mahjong' : 'Lami Mahjong'}
            </h1>
            <button 
              onClick={() => setGameMode(null)}
              className="p-2 hover:bg-white/10 rounded-full transition"
              title="Return to Home"
            >
              <Home size={20} />
            </button>
          </div>
          
          {/* Game Switcher Tabs */}
          <div className="bg-black/20 p-1 rounded-xl flex gap-1">
             <button 
                onClick={() => setGameMode('mahjong')}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition ${gameMode === 'mahjong' ? 'bg-white text-mj-green shadow-sm' : 'text-white/70 hover:bg-white/10'}`}
             >
                3P Mahjong
             </button>
             <button 
                onClick={() => setGameMode('lami')}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition ${gameMode === 'lami' ? 'bg-white text-blue-600 shadow-sm' : 'text-white/70 hover:bg-white/10'}`}
             >
                Lami Mahjong
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 flex-1 w-full animate-fade-in">
         {gameMode === 'mahjong' ? <MahjongGame /> : <LamiGame />}
      </main>

      <footer className="py-6 text-center text-gray-400 text-xs font-medium">
        <p>Created by Adam Chia</p>
      </footer>
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