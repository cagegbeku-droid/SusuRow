import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  RefreshCw, 
  Clock,
  Info
} from 'lucide-react';
import { initiatePayment, verifyPayment } from '../api/client';
import { useModalBackdropClose } from '../hooks/useModalBackdropClose';

const PAYSTACK_PUBLIC_KEY = "pk_live_91afa1d8fbd591e8d5ae17327033f2cb3a33148a";

export const MoMoPaymentModal = ({
  isOpen,
  onClose,
  group,
  member,
  isEscrow = false,
  onPaymentSuccess
}) => {
  const { handleBackdropClick } = useModalBackdropClose(isOpen, onClose);
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

  const pollTimerRef = useRef(null);

  // Clean phone number format for Ghanaian telecom networks (0XXXXXXXXX)
  const cleanPhone = (phoneNumber || member?.phone_number || '').replace('+233', '0').replace(/[^\d]/g, '');

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Background auto-polling when prompt is active
  useEffect(() => {
    if (paymentStatus === 'PROMPTED' && txRef) {
      let attempts = 0;
      pollTimerRef.current = setInterval(async () => {
        attempts += 1;
        if (attempts > 30) { // Stop after ~90 seconds
          clearInterval(pollTimerRef.current);
          return;
        }
        try {
          const res = await verifyPayment(txRef);
          if (res.status === 'SUCCESS' || res.status === 'success' || res.paid) {
            clearInterval(pollTimerRef.current);
            setPaymentStatus('SUCCESS');
            setStatusMessage('Payment verified successfully on Mobile Money!');
            setTimeout(() => {
              if (onPaymentSuccess) onPaymentSuccess();
              onClose();
            }, 1800);
          }
        } catch {
          // Keep polling quietly
        }
      }, 3000);

      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      };
    }
  }, [paymentStatus, txRef]);

  if (!isOpen || !group || !member) return null;

  // Main payment trigger
  const handlePay = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setPaymentStatus(null);
    setStatusMessage(null);

    // Method 1: Official Paystack Inline SDK (pushes USSD PIN prompt directly to SIM screen)
    if (window.PaystackPop && typeof window.PaystackPop.setup === 'function') {
      try {
        const ref = `${momoProvider.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        setTxRef(ref);

        const handler = window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: member?.email || `${cleanPhone}@susurow.com`,
          amount: Math.round(amount * 100), // Pesewas
          currency: 'GHS',
          channels: ['mobile_money'],
          ref: ref,
          metadata: {
            group_id: group.id,
            member_id: member.id,
            phone_number: cleanPhone,
            provider: momoProvider,
            custom_fields: [
              { display_name: 'Mobile Number', variable_name: 'mobile_number', value: cleanPhone },
              { display_name: 'Group Name', variable_name: 'group_name', value: group.name },
              { display_name: 'Provider', variable_name: 'provider', value: momoProvider }
            ]
          },
          callback: async function(response) {
            setLoading(false);
            setVerifying(true);
            try {
              const verifyRes = await verifyPayment(response.reference);
              if (verifyRes.status === 'SUCCESS' || verifyRes.status === 'success' || verifyRes.paid) {
                setPaymentStatus('SUCCESS');
                setStatusMessage('Payment verified and credited to group ledger!');
                setTimeout(() => {
                  if (onPaymentSuccess) onPaymentSuccess();
                  onClose();
                }, 1500);
              } else {
                setPaymentStatus('PROMPTED');
                setStatusMessage('Authorization received! Updating ledger...');
              }
            } catch {
              setPaymentStatus('PROMPTED');
            } finally {
              setVerifying(false);
            }
          },
          onClose: function() {
            setLoading(false);
          }
        });

        handler.openIframe();
        setLoading(false);
        return;
      } catch (inlineErr) {
        console.warn('Paystack inline SDK error, falling back to server API:', inlineErr);
      }
    }

    // Method 2: Server-side Charge API fallback (pushes USSD debit prompt directly to telecom SIM)
    try {
      const res = await initiatePayment({
        group_id: group.id,
        member_id: member.id,
        momo_provider: momoProvider,
        is_commitment_deposit: isEscrow
      });

      setTxRef(res.transaction_reference);
      setPaymentStatus('PROMPTED');
      setStatusMessage(res.message || `Payment prompt sent to ${cleanPhone || phoneNumber}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Payment prompt failed. Please check your phone number and network.');
      setPaymentStatus('FAILED');
    } finally {
      setLoading(false);
    }
  };

  // Manual Check Payment Status
  const handleCheckStatus = async () => {
    if (!txRef) return;
    setVerifying(true);
    setError(null);

    try {
      const res = await verifyPayment(txRef);
      if (res.status === 'SUCCESS' || res.status === 'success' || res.paid) {
        setPaymentStatus('SUCCESS');
        setStatusMessage('Payment verified successfully on Mobile Money!');
        setTimeout(() => {
          if (onPaymentSuccess) onPaymentSuccess();
          onClose();
        }, 1500);
      } else {
        setStatusMessage(res.message || 'Payment prompt is still pending. Please approve the prompt or check *170# > Approvals.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment is still awaiting approval on your phone.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
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
          
          {/* SUCCESS BANNER */}
          {paymentStatus === 'SUCCESS' && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs space-y-1 text-center animate-in zoom-in-95">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-1" />
              <p className="font-bold text-sm text-slate-900">Payment Verified & Settled!</p>
              <p className="text-xs text-slate-700 font-medium">Your contribution has been recorded in the group ledger.</p>
            </div>
          )}

          {/* PROMPTED / WAITING SCREEN (Direct MoMo PIN Prompt) */}
          {paymentStatus === 'PROMPTED' && (
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-sky-900 text-xs space-y-3 text-center animate-in fade-in">
              <div className="relative w-9 h-9 mx-auto flex items-center justify-center">
                <Clock className="w-8 h-8 text-sky-600 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Prompt Dispatched to {cleanPhone || phoneNumber}</p>
                <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
                  Please check your phone screen to enter your MoMo PIN to confirm charges.
                </p>
              </div>

              {/* Offline USSD Approvals Instructions */}
              <div className="p-3 bg-white/90 rounded-xl border border-sky-100 text-left text-[11px] text-slate-800 space-y-1.5 shadow-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Info size={13} className="text-sky-600 shrink-0" />
                  <span>Didn't see the USSD pop-up on your screen?</span>
                </div>
                {momoProvider === 'MTN' && (
                  <p className="text-slate-700 leading-relaxed font-medium">
                    Dial <strong className="font-mono text-slate-950">*170#</strong> ➔ Select <strong className="font-mono text-slate-950">6</strong> (My Wallet) ➔ Select <strong className="font-mono text-slate-950">3</strong> (My Approvals) to enter your PIN and approve.
                  </p>
                )}
                {momoProvider === 'TELECEL' && (
                  <p className="text-slate-700 leading-relaxed font-medium">
                    Dial <strong className="font-mono text-slate-950">*110#</strong> ➔ Select Approvals to enter your PIN and authorize.
                  </p>
                )}
                {momoProvider === 'AT' && (
                  <p className="text-slate-700 leading-relaxed font-medium">
                    Dial <strong className="font-mono text-slate-950">*110#</strong> to approve the pending transaction.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={verifying}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {verifying ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-white" />
                      <span>Checking Network...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} className="text-white" />
                      <span>Check Payment Status</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus(null);
                    setError(null);
                  }}
                  className="w-full py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Change Wallet / Try Again
                </button>
              </div>
            </div>
          )}

          {/* ERROR ALERT */}
          {error && (
            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Display */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-1">
            <div className="text-[11px] uppercase font-bold text-slate-700">Amount to Pay</div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              GH₵{Number(amount).toFixed(2)}
            </div>
            <div className="text-xs text-slate-600 font-bold">Direct Mobile Money Debit (MTN • Telecel • AT)</div>
          </div>

          {/* Network Selector & Main Action Button */}
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
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending MoMo Prompt to SIM...</span>
                  </>
                ) : (
                  <>
                    <Smartphone size={16} className="text-white" />
                    <span>Send MoMo PIN Prompt (GH₵{Number(amount).toFixed(2)})</span>
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
