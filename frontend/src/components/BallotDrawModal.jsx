import React, { useState } from 'react';
import { X, Shuffle, Sparkles, CheckCircle2, Loader2, Trophy } from 'lucide-react';
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
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await executeBallotDraw({
        group_id: group.id,
        seed: `${group.id}-${Date.now()}`
      });

      setDrawResults(res.members);
      setShuffled(true);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="dark-card w-full max-w-md rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-violet-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-amber-300 mb-1">
            <Sparkles size={13} />
            <span>Fair Cryptographic Draw</span>
          </div>

          <h2 className="text-xl font-black text-white">
            Random Ballot Shuffle
          </h2>
          <p className="text-xs text-purple-200 mt-0.5">
            Group: <strong>{group.name}</strong> ({group.members?.length} savers)
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/10 text-red-300 text-xs border border-red-500/30">
              {error}
            </div>
          )}

          {!shuffled ? (
            <div className="text-center space-y-5 py-2">
              <div className="w-18 h-18 rounded-3xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto shadow-lg">
                <Shuffle size={32} />
              </div>

              <div>
                <h3 className="text-base font-black text-white">Ready to Shuffle Payout Turns?</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  All {group.members?.length} slots will be randomly assigned a payout round (1 to {group.members_count}) using a fair seeded random engine.
                </p>
              </div>

              <div className="bg-[#0E1322] p-3.5 rounded-2xl text-xs text-slate-300 border border-white/5 text-left space-y-1">
                <div className="font-bold text-white text-[11px]">Participating Savers:</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {group.members?.map(m => m.full_name).join(' • ')}
                </div>
              </div>

              <button
                onClick={handleDraw}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Draw...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Spin & Assign Ballot Positions</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="text-center pb-1">
                <span className="text-xs font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-400" />
                  <span>Ballot Order Assigned!</span>
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {drawResults.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-[#0E1322] border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        #{m.payout_position}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white">{m.full_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{m.phone_number}</div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-bold text-amber-400">
                      Round #{m.payout_position}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-[#1C233A] hover:bg-[#252E4B] text-white font-bold text-xs rounded-2xl transition-all cursor-pointer border border-white/10"
              >
                Apply & Return to Group
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
