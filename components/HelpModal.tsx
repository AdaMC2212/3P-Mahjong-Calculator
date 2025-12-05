import React from 'react';
import { X, BookOpen, Calculator, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-mj-green p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen size={20} /> How to Use & Rules
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Section 1: App Guide */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-mj-green flex items-center gap-2 border-b border-gray-100 pb-2">
              <Calculator size={18} /> Using the Calculator
            </h3>
            <ul className="space-y-4 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="font-bold text-gray-900 min-w-[20px]">1.</span>
                <div>
                  <strong className="block text-gray-900">Setup Game Settings</strong>
                  Tap the Gear icon to set Player Names and the value of 1 Fan (e.g., RM 0.50). You can also toggle Fei/Kong rules.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-gray-900 min-w-[20px]">2.</span>
                <div>
                  <strong className="block text-gray-900">Enter Round Results</strong>
                  <ul className="list-disc list-inside mt-1 text-gray-600 space-y-1">
                    <li>Select the <strong>Winner</strong> (The current Dealer/East is marked in Red).</li>
                    <li>Choose <strong>Self Draw (Zimo)</strong> or <strong>Discard (Chun)</strong>.</li>
                    <li>If Discard, select who threw the tile.</li>
                    <li>Enter the total <strong>Fan</strong> (Min 5).</li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-gray-900 min-w-[20px]">3.</span>
                <div>
                  <strong className="block text-gray-900">Fei & Kong (Bonus Tiles)</strong>
                  Use the +/- buttons to add Fei or Kong counts for <strong>ANY</strong> player who had them during the round, not just the winner.
                  <br/>
                  <span className="text-xs text-mj-gold bg-yellow-50 px-1 rounded">Note: Total Fei across all players is limited to 4.</span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-gray-900 min-w-[20px]">4.</span>
                <div>
                  <strong className="block text-gray-900">Dealer Rotation</strong>
                  The app automatically assigns the Winner as the next Dealer (East).
                </div>
              </li>
            </ul>
          </section>

          {/* Section 2: Rules */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-mj-green flex items-center gap-2 border-b border-gray-100 pb-2">
              <Info size={18} /> Malaysia 3-Player Rules
            </h3>
            
            <div className="text-sm text-gray-700 space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Winning Payouts</h4>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 grid gap-2">
                  <div className="grid grid-cols-[80px_1fr] items-baseline">
                    <span className="font-bold text-mj-table">Zimo:</span>
                    <span>Winner receives full pay from both other players.</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] items-baseline">
                    <span className="font-bold text-red-500">Chun:</span>
                    <span>Discarder pays full. The third player pays half.</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-1">Burst (Bao)</h4>
                <p>
                  If the Fan count reaches the "Burst Limit" (default 10 Fan), the payout is <strong>Doubled</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-1">Fei & Kong (Bonus)</h4>
                <p className="mb-2">
                  These are separate payouts settled immediately (or calculated at end of round).
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs font-mono">
                  Price = (1 Fan Value) × 2
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Example: If 1 Fan is $1.00, getting 1 Fei earns you $2.00 from BOTH other players ($4.00 total), regardless of who won the hand.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};