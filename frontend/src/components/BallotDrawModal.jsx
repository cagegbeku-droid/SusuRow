import React, { useState } from 'react';
import { X, Shuffle, Sparkles, CheckCircle2, Loader2, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { executeBallotDraw } from '../api/client';

export const BallotDrawModal = ({ isOpen, onClose, group, onDrawComplete }) => {
  const [loading, setLoading] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [drawResults, setDrawResults] = useState([]);
  const [error, setError] = useState(null);

  if (!isOpen || !group) return null;

  const handleDraw = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate visual spinning excitement
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await executeBallotDraw({
        group_id: group.id,
        seed: `${group.id}-${Date.now()}`
      });

      setDrawResults(res.members);
      setShuffled(true);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#005B52', '#D99B26', '#8B5CF6', '#10B981']
      });

      if (onDrawComplete) {
        onDrawComplete(res);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Ballot shuffle failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Cryptographic Fairness Draw</span>
          </div>

          <h2 className="text-xl font-black font-display tracking-tight">
            Random Ballot Shuffle
          </h2>
          <p className="text-xs text-purple-200 mt-0.5">
            Circle: <strong>{group.name}</strong> ({group.members?.length} savers)
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          {!shuffled ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-20 h-20 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/15 animate-bounce">
                <Shuffle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Ready to Shuffle Payout Turns?</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  All {group.members?.length} slots will be randomly assigned a payout round (1 to {group.members_count}) using a cryptographically seeded random engine.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-600 border border-slate-200/80 text-left space-y-1">
                <div className="font-bold text-slate-800">Participating Savers:</div>
                <div className="text-[11px] text-slate-500">
                  {group.members?.map(m => m.full_name).join(' • ')}
                </div>
              </div>

              <button
                onClick={handleDraw}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Cryptographic Draw...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Spin & Assign Ballot Positions</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="text-center pb-2">
                <span className="text-xs font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ballot Order Assigned!</span>
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {drawResults.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        #{m.payout_position}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{m.full_name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{m.phone_number}</div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-bold text-amber-800">
                      Round #{m.payout_position} Recipient
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all"
              >
                Apply & Return to Circle
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
