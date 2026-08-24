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
  const { registerWithPassword, loginWithPassword, loginWithGoogle, requestOtp, verifyAndLogin } = useUser();
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'otp'
  
  // Form fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [momoProvider, setMomoProvider] = useState('MTN');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      // Fast Google OAuth Profile payload
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const email = prompt("Enter your Google Email address for instant sign-in:", "kwame.mensah@gmail.com");
      if (!email) {
        setGoogleLoading(false);
        return;
      }
      const name = prompt("Enter your Full Legal Name:", "Kwame Mensah") || "Google Saver";

      await loginWithGoogle({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="dark-card rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border border-white/10 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-300 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>SusuRow Account</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {tab === 'login' && 'Sign In to Continue'}
            {tab === 'register' && 'Create Your Account'}
            {tab === 'otp' && 'Verify SMS Code'}
          </h2>
          <p className="text-xs text-blue-100 mt-0.5">
            {tab === 'login' && 'Enter your phone number or Google account to access your groups.'}
            {tab === 'register' && 'Save together in groups with 0% loan interest.'}
            {tab === 'otp' && `Enter the 6-digit code sent to ${phoneNumber}`}
          </p>
        </div>

        {/* Tab Switcher */}
        {tab !== 'otp' && (
          <div className="flex border-b border-white/5 bg-[#0E1322]">
            <button
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                tab === 'login'
                  ? 'border-blue-500 text-white bg-[#141A2D] font-black shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-white'
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
                  ? 'border-blue-500 text-white bg-[#141A2D] font-black shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Register New Account
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          {tab !== 'otp' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {googleLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">or with phone</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>
            </>
          )}

          {/* 1. LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Ghana Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                    +233
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="024 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-14 pr-3.5 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[11px] font-bold text-blue-400 hover:underline cursor-pointer"
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
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-white placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 9 || password.length < 1}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all cursor-pointer active:scale-95"
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

              <div className="pt-2 text-center text-xs text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                  }}
                  className="text-blue-400 font-bold hover:underline cursor-pointer"
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
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                    +233
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="024 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-14 pr-3.5 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
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
                      className={`py-2 text-center rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                        momoProvider === p.id
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300 ring-2 ring-blue-500/40 font-black'
                          : 'border-white/5 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Create Password (min 4 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-white placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 9 || password.length < 4 || !fullName.trim()}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all cursor-pointer active:scale-95"
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

              <div className="pt-2 text-center text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className="text-blue-400 font-bold hover:underline cursor-pointer"
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
                <label className="block text-xs font-bold text-slate-300 mb-1 text-center">
                  Enter 6-Digit SMS Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="------"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full py-3 text-center tracking-[0.4em] text-2xl font-black font-mono rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Continue</span>}
              </button>

              <div className="text-center text-xs text-slate-400 pt-1">
                {resendCountdown > 0 ? (
                  <span>Resend code in {resendCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
                <span className="mx-2">•</span>
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="text-slate-400 hover:text-white cursor-pointer"
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
