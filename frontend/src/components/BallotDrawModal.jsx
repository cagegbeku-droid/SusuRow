import React, { useState } from 'react';
import { X, Shuffle, Sparkles, CheckCircle2, Loader2, Trophy } from 'lucide-react';
import { executeBallotDraw } from '../api/client';
import { useModalBackdropClose } from '../hooks/useModalBackdropClose';

export const BallotDrawModal = ({ isOpen, onClose, group, onDrawComplete }) => {
  const { handleBackdropClick } = useModalBackdropClose(isOpen, onClose);
  const [loading, setLoading] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [drawResults, setDrawResults] = useState([]);
  const [error, setError] = useState(null);

  if (!isOpen || !group) return null;

  const handleDraw = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

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
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-amber-200 mb-1">
            <Sparkles size={13} />
            <span>Fair Cryptographic Draw</span>
          </div>

          <h2 className="text-xl font-bold text-white">
            Random Ballot Shuffle
          </h2>
          <p className="text-xs text-purple-100 mt-0.5">
            Group: <strong>{group.name}</strong> ({group.members?.length} savers)
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 bg-white space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-200 font-bold">
              {error}
            </div>
          )}

          {!shuffled ? (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center mx-auto shadow-xs">
                <Shuffle size={28} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Ready to Shuffle Payout Turns?</h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1 leading-relaxed font-medium">
                  All {group.members?.length} slots will be randomly assigned a payout round (1 to {group.members_count}) using a fair seeded random draw.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl text-xs text-slate-700 border border-slate-200 text-left space-y-1">
                <div className="font-bold text-slate-900 text-xs">Participating Savers:</div>
                <div className="text-xs text-slate-600 font-mono font-bold">
                  {group.members?.map(m => m.full_name).join(' • ')}
                </div>
              </div>

              <button
                onClick={handleDraw}
                disabled={loading}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Executing Draw...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Spin & Assign Ballot Positions</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="text-center pb-1">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                  <Trophy size={14} className="text-emerald-600" />
                  <span>Ballot Order Assigned!</span>
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {drawResults.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        #{m.payout_position}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{m.full_name}</div>
                        <div className="text-[10px] font-mono text-slate-600 font-bold">{m.phone_number}</div>
                      </div>
                    </div>
                    <div className="text-right text-xs font-black text-purple-700">
                      Round #{m.payout_position}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-xs"
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
