import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Lock
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export const AuthGate = () => {
  const { requestOtp, verifyAndLogin } = useUser();
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [momoProvider, setMomoProvider] = useState('MTN');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Auto-detect Ghana Mobile Network from prefix
  useEffect(() => {
    const clean = phoneNumber.replace(/[^\d]/g, '');
    if (clean.length >= 3) {
      const prefix = clean.substring(0, 3);
      if (['024', '054', '055', '059', '025', '053'].includes(prefix)) {
        setMomoProvider('MTN');
      } else if (['020', '050'].includes(prefix)) {
        setMomoProvider('TELECEL');
      } else if (['027', '057', '026', '056'].includes(prefix)) {
        setMomoProvider('AT');
      }
    }
  }, [phoneNumber]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phoneNumber, fullName, momoProvider);
      setStep(2);
      setResendCountdown(60);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send verification code. Please check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyAndLogin(phoneNumber, otpCode, fullName, momoProvider);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-gold-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-950/80 border border-primary-700/50 text-gold-400 text-xs font-bold uppercase tracking-wider shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Susu for Ghana</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Susu<span className="text-gold-400">Row</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto">
            Form a <strong>Group</strong>. Take turns receiving lump-sum payout <strong>Cycles</strong> with 0% interest.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
          
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              {step === 1 ? 'Sign In / Register' : 'Verify Your Phone'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 1 
                ? 'Enter your Mobile Money number to access your groups.' 
                : `Enter the 6-digit SMS code sent to ${phoneNumber}`}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-500 pointer-events-none">
                    +233
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="024 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-sm font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Money Network
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'MTN', label: 'MTN MoMo' },
                    { id: 'TELECEL', label: 'Telecel' },
                    { id: 'AT', label: 'AT Money' }
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setMomoProvider(p.id)}
                      className={`py-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        momoProvider === p.id
                          ? 'border-primary-700 bg-primary-50 text-primary-900 ring-2 ring-primary-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 9}
                className="w-full py-3 px-4 rounded-xl bg-primary-800 hover:bg-primary-900 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Get SMS Code</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="------"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full py-3 text-center tracking-[0.4em] text-2xl font-black font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="w-full py-3 px-4 rounded-xl bg-primary-800 hover:bg-primary-900 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Enter App</span>}
              </button>

              <div className="text-center text-xs text-slate-500 pt-1">
                {resendCountdown > 0 ? (
                  <span>Resend code in {resendCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-primary-700 font-bold hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
                <span className="mx-2">•</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-600 hover:underline cursor-pointer"
                >
                  Change Number
                </button>
              </div>
            </form>
          )}

          {/* Quick Perks */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary-700 shrink-0" />
              <span>0% Loan Interest</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-700 shrink-0" />
              <span>MoMo Direct Payout</span>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-400">
          Protected by Bank of Ghana Partner Security Standards
        </p>

      </div>
    </div>
  );
};
