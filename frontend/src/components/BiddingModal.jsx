import React, { useState } from 'react';
import { X, Gavel, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitBid } from '../api/client';

export const BiddingModal = ({ isOpen, onClose, group, member, onBidSuccess }) => {
  const [bidAmount, setBidAmount] = useState(member?.bid_amount || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !group || !member) return null;

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitBid({
        member_id: member.id,
        bid_amount: Number(bidAmount)
      });

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });

      onClose();
      if (onBidSuccess) onBidSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit bid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="dark-card w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-amber-300 mb-1">
            <Gavel size={13} />
            <span>Auction Scheme</span>
          </div>

          <h2 className="text-xl font-black text-white">
            Place Your Turn Bid
          </h2>
          <p className="text-xs text-blue-200 mt-0.5">
            Group: <strong>{group.name}</strong>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleBidSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-300 text-xs border border-red-500/30">
              {error}
            </div>
          )}

          <div className="bg-[#0E1322] rounded-2xl p-3.5 border border-white/5 space-y-1 text-xs text-slate-300">
            <p className="font-bold text-white">How Bidding Works:</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Savers offering the highest discount bid win the earliest payout rounds. The bid amount is redistributed as bonus yield to remaining savers.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Your Discount Bid Amount (GH₵)
            </label>
            <input
              type="number"
              min={0}
              max={group.total_pool || 5000}
              step={10}
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold text-white placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>Submit Bid</span>}
          </button>
        </form>

      </div>
    </div>
  );
};
