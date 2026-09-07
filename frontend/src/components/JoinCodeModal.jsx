import React, { useState } from 'react';
import { X, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { getGroupByCode } from '../api/client';
import { useModalBackdropClose } from '../hooks/useModalBackdropClose';

export const JoinCodeModal = ({ isOpen, onClose, onCircleFound }) => {
  const { handleBackdropClick } = useModalBackdropClose(isOpen, onClose);
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
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs"
    >
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
              <KeyRound size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Join with Group Code</h3>
              <p className="text-[11px] text-slate-600 font-medium">Enter your 6-character code</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white">
          {error && (
            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1 text-center">
              Invite Code
            </label>
            <input
              type="text"
              required
              placeholder="SUSU-0000"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full py-3 text-center tracking-[0.25em] text-xl font-black font-mono rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 uppercase placeholder-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
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
