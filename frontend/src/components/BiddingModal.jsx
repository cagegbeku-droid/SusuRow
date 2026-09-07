import React, { useState } from 'react';
import { X, Gavel, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { submitBid } from '../api/client';
import { useModalBackdropClose } from '../hooks/useModalBackdropClose';

export const BiddingModal = ({ isOpen, onClose, group, member, onBidSuccess }) => {
  const { handleBackdropClick } = useModalBackdropClose(isOpen, onClose);
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

      onClose();
      if (onBidSuccess) onBidSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit bid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-amber-200 mb-1">
            <Gavel size={13} />
            <span>Auction Scheme</span>
          </div>

          <h2 className="text-xl font-bold text-white">
            Place Your Turn Bid
          </h2>
          <p className="text-xs text-sky-100 mt-0.5">
            Group: <strong>{group.name}</strong>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleBidSubmit} className="p-5 sm:p-6 space-y-4 bg-white">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-200 font-bold">
              {error}
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-1 text-xs text-slate-700">
            <p className="font-bold text-slate-900">How Bidding Works:</p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Savers offering the highest discount bid win the earliest payout rounds. The bid amount is redistributed as bonus yield to remaining savers.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Your Discount Bid Amount (GH₵)
            </label>
            <input
              type="number"
              min={0}
              max={group.total_pool || 5000}
              step={10}
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono font-bold text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>Submit Bid</span>}
          </button>
        </form>

      </div>
    </div>
  );
};
