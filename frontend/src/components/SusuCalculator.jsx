import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

export const SusuCalculator = ({ isOpen, onClose, onLaunchCircle }) => {
  const [contribution, setContribution] = useState(500);
  const [members, setMembers] = useState(5);
  const [frequency, setFrequency] = useState('WEEKLY');

  if (!isOpen) return null;

  const totalPot = contribution * members;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-primary-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-base font-bold text-white">
            Cycle Pot Calculator
          </h2>
          <p className="text-xs text-primary-200 mt-0.5">
            Calculate total payout and cycle schedule
          </p>
        </div>

        {/* Calculator Body */}
        <div className="p-5 space-y-4">
          
          {/* Pot Display Box */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Total Payout Pot per Turn
            </div>
            
            <div className="text-3xl font-black text-gold-400 font-mono">
              GH₵{totalPot.toLocaleString()}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
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

          {/* Inputs */}
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Contribution per turn:</span>
                <span className="text-primary-800 font-mono text-sm font-black">GH₵{contribution.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={contribution}
                onChange={(e) => setContribution(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-primary-700"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-bold">
                <span>GH₵50</span>
                <span>GH₵2,500</span>
                <span>GH₵5,000</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Group members:</span>
                <span className="text-primary-800 font-mono text-sm font-black">{members} Savers</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={members}
                onChange={(e) => setMembers(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-primary-700"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-bold">
                <span>2</span>
                <span>15</span>
                <span>30</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
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
                        ? 'border-primary-700 bg-primary-50 text-primary-900 ring-2 ring-primary-700'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
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
            className="w-full py-3 bg-primary-800 hover:bg-primary-900 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Create Group with These Settings</span>
            <ArrowRight className="w-3.5 h-3.5 text-gold-300" />
          </button>

        </div>
      </div>
    </div>
  );
};
