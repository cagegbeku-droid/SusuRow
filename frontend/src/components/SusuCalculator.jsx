import React, { useState } from 'react';
import { X, ArrowRight, Sparkles, Coins, Calculator } from 'lucide-react';

export const SusuCalculator = ({ isOpen, onClose, onLaunchCircle }) => {
  const [contribution, setContribution] = useState(500);
  const [members, setMembers] = useState(5);
  const [frequency, setFrequency] = useState('WEEKLY');

  if (!isOpen) return null;

  const totalPot = contribution * members;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md">
      <div className="dark-card w-full max-w-md rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-300 uppercase tracking-wider mb-1">
            <Calculator size={13} />
            <span>Interactive Simulator</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            Cycle Pot Calculator
          </h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Estimate total lump-sum pot returns and schedules
          </p>
        </div>

        {/* Calculator Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Pot Display Box (Image 1 style) */}
          <div className="bg-[#0E1322] rounded-3xl p-4 sm:p-5 border border-white/10 text-center space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Total Payout Pot per Turn
            </div>
            
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
              GH₵{totalPot.toLocaleString()}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
              <div>
                <span className="text-slate-400 text-[10px]">Your Total Input:</span>
                <div className="font-bold text-white font-mono">GH₵{totalPot.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px]">Total Turns:</span>
                <div className="font-bold text-white">{members} Rounds</div>
              </div>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-300 mb-1">
                <span>Contribution per turn:</span>
                <span className="text-blue-400 font-mono text-sm font-black">GH₵{contribution.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={contribution}
                onChange={(e) => setContribution(Number(e.target.value))}
                className="w-full h-2 bg-[#0E1322] rounded-lg cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-bold">
                <span>GH₵50</span>
                <span>GH₵2,500</span>
                <span>GH₵5,000</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-300 mb-1">
                <span>Group members:</span>
                <span className="text-blue-400 font-mono text-sm font-black">{members} Savers</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={members}
                onChange={(e) => setMembers(Number(e.target.value))}
                className="w-full h-2 bg-[#0E1322] rounded-lg cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-bold">
                <span>2</span>
                <span>15</span>
                <span>30</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                Cycle Schedule
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['DAILY', 'WEEKLY', 'MONTHLY'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`py-2 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
                      frequency === freq
                        ? 'border-blue-500 bg-blue-500/10 text-white ring-2 ring-blue-500/40 shadow-sm'
                        : 'border-white/5 bg-[#0E1322] text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    {freq.charAt(0) + freq.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              if (onLaunchCircle) {
                onLaunchCircle({ contribution, members, frequency });
              }
            }}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>Create Group with These Settings</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>

        </div>
      </div>
    </div>
  );
};
