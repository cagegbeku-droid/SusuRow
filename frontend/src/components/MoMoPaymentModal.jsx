import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Delete,
  Lock,
  RefreshCw,
  Clock
} from 'lucide-react';
import { initiatePayment, verifyPayment } from '../api/client';

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
  const [verifying, setVerifying] = useState(false);
  const [txRef, setTxRef] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'PROMPTED' | 'SUCCESS' | 'FAILED' | 'PENDING'
  const [statusMessage, setStatusMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !group || !member) return null;

  const handleKeypadPress = (key) => {
    if (paymentStatus === 'PROMPTED') return;
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
    setStatusMessage(null);

    try {
      const res = await initiatePayment({
        group_id: group.id,
        member_id: member.id,
        momo_provider: momoProvider,
        is_commitment_deposit: isEscrow
      });

      setTxRef(res.transaction_reference);
      setPaymentStatus('PROMPTED');
      setStatusMessage(res.message || `Payment prompt sent to ${phoneNumber}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Payment prompt failed. Please check your phone number and network.');
      setPaymentStatus('FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!txRef) return;
    setVerifying(true);
    setError(null);

    try {
      const res = await verifyPayment(txRef);
      if (res.status === 'SUCCESS') {
        setPaymentStatus('SUCCESS');
        setStatusMessage('Payment verified successfully on Mobile Money!');
        setTimeout(() => {
          if (onPaymentSuccess) onPaymentSuccess();
          onClose();
        }, 2000);
      } else {
        setStatusMessage(res.message || 'Payment prompt is still pending. Please approve on your phone first.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not verify payment status yet. Please approve the prompt on your phone.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="dark-card w-full max-w-sm rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-[#0E1322] p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              ₵
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Mobile Money Payment</h3>
              <p className="text-[11px] text-slate-400 font-mono">Round {group.current_round} • {group.name}</p>
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
          
          {/* Status Alert Banners */}
          {paymentStatus === 'PROMPTED' && (
            <div className="p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/30 text-blue-300 text-xs space-y-2 text-center">
              <Clock className="w-6 h-6 text-blue-400 mx-auto" />
              <p className="font-bold">Prompt Dispatched to {phoneNumber}</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {momoProvider === 'MTN' && 'Please check your phone screen to enter your MoMo PIN, or dial *170# > Approvals.'}
                {momoProvider === 'TELECEL' && 'Please check your phone screen or dial *110# to approve the payment.'}
                {momoProvider === 'AT' && 'Please approve the prompt on your phone screen.'}
              </p>
              
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={verifying}
                className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {verifying ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Check Payment Status</span>
                  </>
                )}
              </button>
            </div>
          )}

          {paymentStatus === 'SUCCESS' && (
            <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-emerald-300 text-xs space-y-1 text-center">
              <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400 mb-1" />
              <p className="font-bold text-sm">Payment Verified & Settled!</p>
              <p className="text-[11px] text-slate-300">Your contribution has been recorded in the group ledger.</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && paymentStatus !== 'PROMPTED' && paymentStatus !== 'SUCCESS' && (
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-300 text-xs text-center">
              {statusMessage}
            </div>
          )}

          {/* Amount Display */}
          <div className="bg-[#0E1322] rounded-2xl p-4 border border-white/5 text-center space-y-1">
            <div className="text-[11px] uppercase font-bold text-slate-400">Amount to Pay</div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono">
              GH₵{amount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Bank of Ghana Mobile Money Rail</div>
          </div>

          {/* Network Selector Pills */}
          {paymentStatus !== 'PROMPTED' && paymentStatus !== 'SUCCESS' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 px-1">
                  Mobile Money Network
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'MTN', name: 'MTN MoMo' },
                    { id: 'TELECEL', name: 'Telecel' },
                    { id: 'AT', name: 'AT Money' }
                  ].map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setMomoProvider(provider.id)}
                      className={`py-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        momoProvider === provider.id
                          ? 'border-blue-500 bg-blue-600 text-white shadow font-bold'
                          : 'border-white/10 bg-[#0E1322] text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {provider.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Pay Action Button */}
              <button
                type="button"
                onClick={handlePay}
                disabled={loading || amount <= 0}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Smartphone size={16} />
                    <span>Send MoMo Prompt (GH₵{amount.toLocaleString()})</span>
                  </>
                )}
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
