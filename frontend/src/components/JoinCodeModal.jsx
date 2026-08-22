import React, { useState } from 'react';
import { X, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { getGroupByCode } from '../api/client';

export const JoinCodeModal = ({ isOpen, onClose, onCircleFound }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const group = await getGroupByCode(code.trim().toUpperCase());
      onClose();
      if (onCircleFound) onCircleFound(group);
    } catch (err) {
      setError(err.response?.data?.detail || 'No group found with this invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md">
      <div className="dark-card w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0E1322] p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <KeyRound size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">Join with Group Code</h3>
              <p className="text-[10px] text-slate-400">Enter your 6-character code</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#141A2D] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 text-center">
              Invite Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ACCRA5"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full py-3 text-center tracking-[0.25em] text-xl font-black font-mono rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-amber-400 uppercase placeholder-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Find & Join Group</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
