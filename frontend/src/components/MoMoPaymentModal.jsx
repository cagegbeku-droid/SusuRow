import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
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
  const [amount] = useState(
    isEscrow ? (group?.commitment_deposit || 0) : (group?.contribution_amount || 0)
  );
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [txRef, setTxRef] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'PROMPTED' | 'SUCCESS' | 'FAILED'
  const [statusMessage, setStatusMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !group || !member) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-50 p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
              ₵
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mobile Money Payment</h3>
              <p className="text-xs text-slate-600 font-mono font-bold">Round {group.current_round} • {group.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* Status Prompts */}
          {paymentStatus === 'PROMPTED' && (
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-sky-900 text-xs space-y-2 text-center">
              <Clock className="w-6 h-6 text-sky-700 mx-auto" />
              <p className="font-bold text-slate-900 text-sm">Prompt Dispatched to {phoneNumber}</p>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {momoProvider === 'MTN' && 'Please check your phone screen to enter your MoMo PIN, or dial *170# > Approvals.'}
                {momoProvider === 'TELECEL' && 'Please check your phone screen or dial *110# to approve the payment.'}
                {momoProvider === 'AT' && 'Please approve the prompt on your phone screen.'}
              </p>
              
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={verifying}
                className="w-full mt-2 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {verifying ? (
                  <RefreshCw size={14} className="animate-spin text-white" />
                ) : (
                  <>
                    <ShieldCheck size={14} className="text-white" />
                    <span>Check Payment Status</span>
                  </>
                )}
              </button>
            </div>
          )}

          {paymentStatus === 'SUCCESS' && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs space-y-1 text-center">
              <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-600 mb-1" />
              <p className="font-bold text-sm text-slate-900">Payment Verified & Settled!</p>
              <p className="text-xs text-slate-700 font-medium">Your contribution has been recorded in the group ledger.</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && paymentStatus !== 'PROMPTED' && paymentStatus !== 'SUCCESS' && (
            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-sky-900 text-xs text-center font-medium">
              {statusMessage}
            </div>
          )}

          {/* Amount Display */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-1">
            <div className="text-[11px] uppercase font-bold text-slate-700">Amount to Pay</div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              GH₵{amount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-600 font-bold">Secure Mobile Money (MTN • Telecel • AT)</div>
          </div>

          {/* Network Selector Pills */}
          {paymentStatus !== 'PROMPTED' && paymentStatus !== 'SUCCESS' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 px-1">
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
                          ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-xs ring-2 ring-sky-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
                className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Smartphone size={16} className="text-white" />
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
