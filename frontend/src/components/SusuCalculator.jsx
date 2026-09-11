import React, { useState } from 'react';
import { X, ArrowRight, Sparkles, Coins, Calculator } from 'lucide-react';
import { useModalBackdropClose } from '../hooks/useModalBackdropClose';

export const SusuCalculator = ({ isOpen, onClose, onLaunchCircle }) => {
  const { handleBackdropClick } = useModalBackdropClose(isOpen, onClose);
  const [contribution, setContribution] = useState(500);
  const [members, setMembers] = useState(5);
  const [frequency, setFrequency] = useState('WEEKLY');

  if (!isOpen) return null;

  const totalPot = contribution * members;

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 relative bg-slate-50/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black text-sky-700 uppercase tracking-wider mb-1">
            <Calculator size={13} />
            <span>Interactive Simulator</span>
          </div>

          <h2 className="text-xl font-black text-slate-900">
            Susu Payout Calculator
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Estimate total lump-sum payout and schedules
          </p>
        </div>

        {/* Calculator Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Payout Display Box */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-center space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
              Total Lump Sum Payout
            </div>
            
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              GH₵{totalPot.toLocaleString()}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] font-bold">Your Total Input:</span>
                <div className="font-bold text-slate-900 font-mono">GH₵{totalPot.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[10px] font-bold">Total Turns:</span>
                <div className="font-bold text-slate-900">{members} Rounds</div>
              </div>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span>Contribution per turn:</span>
                <span className="text-sky-700 font-mono text-sm font-black">GH₵{contribution.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={contribution}
                onChange={(e) => setContribution(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-bold">
                <span>GH₵50</span>
                <span>GH₵2,500</span>
                <span>GH₵5,000</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span>Group members:</span>
                <span className="text-sky-700 font-mono text-sm font-black">{members} Savers</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={members}
                onChange={(e) => setMembers(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-bold">
                <span>2</span>
                <span>15</span>
                <span>30</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Cycle Schedule
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['DAILY', 'WEEKLY', 'MONTHLY'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      frequency === freq
                        ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-600/30 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>Create Group with These Settings</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>

        </div>
      </div>
    </div>
  );
};
