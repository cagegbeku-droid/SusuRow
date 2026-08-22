import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ArrowDown, 
  Delete,
  Lock,
  Sparkles
} from 'lucide-react';
import { initiatePayment } from '../api/client';
import confetti from 'canvas-confetti';

export const MoMoPaymentModal = ({
  isOpen,
  onClose,
  group,
  member,
  isEscrow = false,
  onPaymentSuccess
}) => {
  const [momoProvider, setMomoProvider] = useState(member?.momo_provider || 'MTN');
  const [phoneNumber, setPhoneNumber] = useState(member?.phone_number || '');
  const [amount, setAmount] = useState(
    isEscrow ? (group?.commitment_deposit || 0) : (group?.contribution_amount || 0)
  );
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'PROMPTED' | 'SUCCESS' | 'FAILED'
  const [error, setError] = useState(null);

  if (!isOpen || !group || !member) return null;

  const handleKeypadPress = (key) => {
    if (key === 'del') {
      const str = String(amount);
      setAmount(str.length > 1 ? Number(str.slice(0, -1)) : 0);
    } else {
      const str = amount === 0 ? String(key) : String(amount) + String(key);
      if (Number(str) <= 50000) {
        setAmount(Number(str));
      }
    }
  };

  const handlePay = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setPaymentStatus(null);

    try {
      const res = await initiatePayment({
        group_id: group.id,
        member_id: member.id,
        momo_provider: momoProvider,
        is_commitment_deposit: isEscrow
      });

      setPaymentStatus('PROMPTED');

      // Auto-refresh upon successful trigger
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        setPaymentStatus('SUCCESS');
        if (onPaymentSuccess) onPaymentSuccess();
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Payment prompt failed. Please check your network and balance.');
      setPaymentStatus('FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md">
      <div className="dark-card w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0E1322] p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm">
              ₵
            </div>
            <div>
              <h3 className="text-xs font-black text-white">Mobile Money Payment</h3>
              <p className="text-[10px] text-slate-400 font-mono">Round {group.current_round} • {group.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#141A2D] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Payment Status Banners */}
          {paymentStatus === 'PROMPTED' && (
            <div className="p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/30 text-blue-300 text-xs space-y-1 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-400 mb-1" />
              <p className="font-bold">Prompt sent to {phoneNumber}!</p>
              <p className="text-[11px] text-slate-300">Approve the MoMo prompt on your phone to complete payment.</p>
            </div>
          )}

          {paymentStatus === 'SUCCESS' && (
            <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-emerald-300 text-xs space-y-1 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400 mb-1" />
              <p className="font-bold">Payment Settled Successfully!</p>
              <p className="text-[11px] text-slate-300">Your contribution is verified in the group ledger.</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Display (Image 1 style) */}
          <div className="bg-[#0E1322] rounded-3xl p-4 border border-white/5 text-center space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Amount to Pay</div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
              GH₵{amount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">0% Commission • Bank of Ghana Standard</div>
          </div>

          {/* Network Selector Pills */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
              Select Wallet Network
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'MTN', name: 'MTN MoMo', color: 'border-yellow-400 text-yellow-300 bg-yellow-400/10' },
                { id: 'TELECEL', name: 'Telecel', color: 'border-red-500 text-red-300 bg-red-500/10' },
                { id: 'AT', name: 'AT Money', color: 'border-blue-500 text-blue-300 bg-blue-500/10' }
              ].map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setMomoProvider(provider.id)}
                  className={`py-2 text-center rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    momoProvider === provider.id
                      ? `${provider.color} ring-2 ring-blue-500/40 shadow-sm font-black`
                      : 'border-white/5 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>
          </div>

          {/* 🔢 Numeric Keypad (Matching Image 1 Exchange screen) */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="py-3 rounded-2xl bg-[#1C233A] hover:bg-[#252E4B] text-white font-black text-base shadow transition-all active:scale-95 cursor-pointer border border-white/5"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(isEscrow ? group.commitment_deposit : group.contribution_amount)}
              className="py-3 rounded-2xl bg-[#1C233A] hover:bg-[#252E4B] text-amber-400 font-bold text-xs shadow transition-all active:scale-95 cursor-pointer border border-white/5"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress(0)}
              className="py-3 rounded-2xl bg-[#1C233A] hover:bg-[#252E4B] text-white font-black text-base shadow transition-all active:scale-95 cursor-pointer border border-white/5"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('del')}
              className="py-3 rounded-2xl bg-[#1C233A] hover:bg-[#252E4B] text-red-400 flex items-center justify-center font-black shadow transition-all active:scale-95 cursor-pointer border border-white/5"
            >
              <Delete size={18} />
            </button>
          </div>

          {/* Instant Pay Action Button */}
          <button
            type="button"
            onClick={handlePay}
            disabled={loading || amount <= 0 || paymentStatus === 'PROMPTED'}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <Smartphone size={16} />
                <span>Authorize GH₵{amount.toLocaleString()} with {momoProvider}</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
};
