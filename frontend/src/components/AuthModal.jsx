import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  RefreshCw, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle, 
  Lock, 
  User, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function AuthModal({ isOpen, onClose }) {
  const { registerWithPassword, loginWithPassword, requestOtp, verifyAndLogin } = useUser();
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'otp'
  
  // Form fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [momoProvider, setMomoProvider] = useState('MTN');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithPassword(phoneNumber, password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid phone or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerWithPassword(fullName, phoneNumber, momoProvider, password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create account. Please check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phoneNumber, fullName, momoProvider);
      setTab('otp');
      setResendCountdown(60);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyAndLogin(phoneNumber, otpCode, fullName, momoProvider, password || undefined);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-950 via-primary-900 to-teal-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gold-400 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>SusuRow Account</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {tab === 'login' && 'Sign In to Continue'}
            {tab === 'register' && 'Create Your Account'}
            {tab === 'otp' && 'Verify SMS Code'}
          </h2>
          <p className="text-xs text-primary-200 mt-0.5">
            {tab === 'login' && 'Enter your phone number and password to access your groups.'}
            {tab === 'register' && 'Save together in groups with 0% loan interest.'}
            {tab === 'otp' && `Enter the 6-digit code sent to ${phoneNumber}`}
          </p>
        </div>

        {/* Tab Switcher (Login / Register) */}
        {tab !== 'otp' && (
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                tab === 'login'
                  ? 'border-primary-800 text-primary-900 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                tab === 'register'
                  ? 'border-primary-800 text-primary-900 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Register New Account
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghana Phone Number
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[11px] font-bold text-primary-700 hover:underline cursor-pointer"
                  >
                    Forgot / Use SMS Code
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-sm font-medium text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 9 || password.length < 1}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-primary-800 hover:bg-primary-900 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                  }}
                  className="text-primary-800 font-bold hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
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
                          ? 'border-primary-800 bg-primary-50 text-primary-900 ring-2 ring-primary-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Create Password (min 4 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-sm font-medium text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 9 || password.length < 4 || !fullName.trim()}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className="text-primary-800 font-bold hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          {/* 3. OTP VERIFICATION FORM */}
          {tab === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                  Enter 6-Digit SMS Code
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
                className="w-full py-3 px-4 rounded-xl bg-primary-800 hover:bg-primary-900 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Continue</span>}
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
                  onClick={() => setTab('login')}
                  className="text-slate-600 hover:underline cursor-pointer"
                >
                  Back to Password Login
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
