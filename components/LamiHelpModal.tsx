
import React from 'react';
import { X, BookOpen, Trophy, Swords, Zap, Spade } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LamiHelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen size={20} /> Lami Mahjong Rules
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2 border-b border-gray-100 pb-2">
              <Trophy size={18} /> Main Settlement
            </h3>
            <p className="text-sm text-gray-700">
              Players are ranked by their remaining points at the end of the round.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="font-bold">Winner:</span>
                <span>Lowest Points</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Rank 2 Pays:</span>
                <span>Base Payout 1</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Rank 3 Pays:</span>
                <span>Base Payout 2</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Rank 4 Pays:</span>
                <span>Base Payout 3</span>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-yellow-800">
              <strong>Cleared Hand Bonus:</strong> If the winner clears their entire hand (completes sets), the "Cleared Hand Bonus" set in settings is added to Rank 2, 3, and 4 payouts.
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2 border-b border-gray-100 pb-2">
              <Spade size={18} /> Suit Priority (Tie-Breaker)
            </h3>
            <p className="text-sm text-gray-700">
              If two players have the same points, the <strong>Suit Priority</strong> determines the rank.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Priority 1 = Highest (Wins the tie)</li>
              <li>Priority 4 = Lowest (Loses the tie)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2 border-b border-gray-100 pb-2">
              <Swords size={18} /> Side Settlements (Joker/Ace)
            </h3>
            <p className="text-sm text-gray-700">
              Side settlements are <strong>independent</strong> of who won the round. Every player compares their Joker and Ace counts with every other player.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs text-blue-800 font-mono">
              Payout = (Difference in Count) × Unit Value
            </div>
            <p className="text-xs text-gray-500 italic">
              Example: Player A has 2 Jokers, Player B has 0. If Joker Unit is $1, Player B pays Player A $2.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
