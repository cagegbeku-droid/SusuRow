import React, { useState } from 'react';
import { X, Gavel, Sparkles, CheckCircle2, AlertCircle, Loader2, Coins } from 'lucide-react';
import { submitBid } from '../api/client';
import confetti from 'canvas-confetti';

export const BiddingModal = ({ isOpen, onClose, group, member, onBidSuccess }) => {
  const [bidAmount, setBidAmount] = useState(member?.bid_amount || 15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !group || !member) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await submitBid({
        member_id: member.id,
        bid_amount: Number(bidAmount)
      });

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (onBidSuccess) {
        onBidSuccess(res);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit bid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-yellow-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
            <Gavel className="w-4 h-4" />
            <span>Competitive Position Auction</span>
          </div>

          <h2 className="text-xl font-black font-display tracking-tight">
            Submit Turn Priority Bid
          </h2>
          <p className="text-xs text-amber-100 mt-0.5">
            Saver: <strong>{member.full_name}</strong> ({member.phone_number})
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Circle Pot:</span>
              <span className="font-bold text-amber-800">GH₵{group.total_pool?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Contribution per Round:</span>
              <span className="font-bold text-slate-800">GH₵{group.contribution_amount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Your Current Position:</span>
              <span className="font-bold text-slate-800">#{member.payout_position || 'Unranked'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Your Discount Bid Amount (GH₵)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                ₵
              </span>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-600 font-black text-base text-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Savers offering the highest discount bid receive priority in earlier payout rounds.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Bid...</span>
                </>
              ) : (
                <>
                  <Gavel className="w-4 h-4" />
                  <span>Submit & Re-rank Positions</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
