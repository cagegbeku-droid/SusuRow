import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Lock,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { initiatePayment, processWebhookSettlement } from '../api/client';

export const MoMoPaymentModal = ({ 
  isOpen, 
  onClose, 
  group, 
  member, 
  isEscrow = false, 
  onPaymentSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [step, setStep] = useState('prompt'); // 'prompt' | 'processing' | 'success'
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState(null);

  const amount = isEscrow ? group?.commitment_deposit : group?.contribution_amount;
  const provider = member?.momo_provider || 'MTN';

  useEffect(() => {
    if (isOpen && group && member) {
      setStep('prompt');
      setError(null);
      setSuccessResult(null);
      handleInitiate();
    }
  }, [isOpen, group?.id, member?.id]);

  const handleInitiate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await initiatePayment({
        group_id: group.id,
        member_id: member.id,
        momo_provider: provider,
        is_commitment_deposit: isEscrow
      });
      setPaymentData(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initiate Mobile Money prompt.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWebhook = async () => {
    if (!paymentData) return;
    setSettling(true);
    setStep('processing');
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      const webhookRes = await processWebhookSettlement({
        transaction_reference: paymentData.transaction_reference,
        momo_provider: paymentData.provider,
        phone_number: member.phone_number,
        amount: paymentData.amount,
        status: 'SUCCESS'
      });

      setSuccessResult(webhookRes);
      setStep('success');

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment could not be completed. Please try again.');
      setStep('prompt');
    } finally {
      setSettling(false);
    }
  };

  if (!isOpen || !group || !member) return null;

  const getProviderHeader = () => {
    switch (provider) {
      case 'MTN':
        return { name: 'MTN Mobile Money', bg: 'bg-yellow-500 text-yellow-950' };
      case 'TELECEL':
        return { name: 'Telecel Cash', bg: 'bg-red-600 text-white' };
      case 'AT':
        return { name: 'AT Money', bg: 'bg-blue-600 text-white' };
      default:
        return { name: 'Mobile Money', bg: 'bg-primary-900 text-white' };
    }
  };

  const headerInfo = getProviderHeader();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className={`p-4 relative ${headerInfo.bg}`}>
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Payment Authorization
          </div>
          <h2 className="text-base font-bold">
            {headerInfo.name}
          </h2>
          <div className="text-xs opacity-90 font-mono">
            {member.phone_number} ({member.full_name})
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {step === 'prompt' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">
                    {isEscrow ? 'Security Deposit' : `Round ${group.current_round} Contribution`}
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono">
                    GH₵{amount?.toFixed(2)}
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary-800 bg-primary-50 px-2.5 py-1 rounded-md border border-primary-200">
                  {group.name}
                </span>
              </div>

              {/* Handset Prompt Card */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>USSD Prompt (*170#)</span>
                  <span className="font-mono">{paymentData?.transaction_reference?.slice(-6) || ''}</span>
                </div>
                <div className="text-emerald-300 font-medium">
                  {paymentData?.ussd_prompt || `Authorize payment of GH₵${amount?.toFixed(2)} to SusuRow.`}
                </div>
              </div>

              <button
                onClick={handleApproveWebhook}
                disabled={loading || settling}
                className="w-full py-2.5 px-4 rounded-lg bg-primary-700 hover:bg-primary-800 text-white font-semibold text-sm shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {settling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Confirm Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-6 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-700 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900">Verifying payment with network...</h3>
            </div>
          )}

          {step === 'success' && (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Payment Successful</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  GH₵{amount?.toFixed(2)} received
                </p>
              </div>

              {successResult?.rotation_result?.advanced && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-900 text-left">
                  <div className="font-bold">Pot Disbursed!</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {successResult.rotation_result.message}
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-all"
              >
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
