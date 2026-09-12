import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  CheckCircle2,
  Check
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { resolveMoMoAccount } from '../api/client';
import { useModalBackdropClose } from '../hooks/useModalBackdropClose';

const GOOGLE_CLIENT_ID = "912069601596-uv6jcts8q2t1bg7sc4h8maju1odnd720.apps.googleusercontent.com";

export default function AuthModal({ isOpen, onClose }) {
  const { registerWithPassword, loginWithPassword, loginWithGoogle, requestOtp, verifyAndLogin } = useUser();
  const { handleBackdropClick } = useModalBackdropClose(isOpen, onClose);
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'otp'
  
  // Form fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [momoProvider, setMomoProvider] = useState('MTN');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // MoMo auto-resolution state
  const [resolvingMoMo, setResolvingMoMo] = useState(false);
  const [resolvedMoMoName, setResolvedMoMoName] = useState(null);

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

  // Handle phone or email input with network auto-detection & automatic MoMo name resolution
  const handlePhoneChange = async (val) => {
    setPhoneNumber(val);
    if (val.includes('@')) {
      setResolvedMoMoName(null);
      return;
    }
    const clean = val.replace(/[^\d]/g, '');

    let detected = momoProvider;
    if (clean.length >= 3) {
      const prefix = clean.substring(0, 3);
      if (['024', '054', '055', '059', '025', '053'].includes(prefix)) {
        detected = 'MTN';
        setMomoProvider('MTN');
      } else if (['020', '050'].includes(prefix)) {
        detected = 'TELECEL';
        setMomoProvider('TELECEL');
      } else if (['027', '057', '026', '056'].includes(prefix)) {
        detected = 'AT';
        setMomoProvider('AT');
      }
    }

    // When 10 digits, auto resolve the registered subscriber name from the telecom network!
    if (clean.length === 10) {
      try {
        setResolvingMoMo(true);
        const res = await resolveMoMoAccount({ phone_number: clean, provider: detected });
        if (res?.success && res?.account_name) {
          setResolvedMoMoName(res.account_name);
          // Auto-fill full name on registration if not filled
          if (tab === 'register' && (!fullName.trim() || fullName.startsWith('Saver '))) {
            setFullName(res.account_name);
          }
        }
      } catch {
        // Quiet fallback
      } finally {
        setResolvingMoMo(false);
      }
    } else {
      setResolvedMoMoName(null);
    }
  };

  // Google OAuth 2.0 Sign In (Standard Universal Flow - works on Web, iOS, and Android WebViews without gsi/transform)
  const handleGoogleClick = () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const redirectUri = window.location.origin;
      const scope = encodeURIComponent('email profile openid');
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&prompt=select_account`;
      
      window.location.href = authUrl;
    } catch (err) {
      console.error('OAuth launch error:', err);
      setGoogleLoading(false);
      setError('Could not open Google sign in. Please sign in with your phone number.');
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithPassword(phoneNumber, password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid phone number or password.');
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
    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Please enter a valid Ghana phone number (e.g. 0000000000).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phoneNumber, fullName || 'Ghana Saver', momoProvider);
      setTab('otp');
      setResendCountdown(60);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send SMS verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyAndLogin(phoneNumber, otpCode, fullName || undefined, momoProvider, password || undefined);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-200 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>SusuRow Ghana</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {tab === 'login' && 'Sign In to SusuRow'}
            {tab === 'register' && 'Create Your Account'}
            {tab === 'otp' && 'Verify SMS Code'}
          </h2>
          <p className="text-xs text-sky-100 mt-0.5">
            {tab === 'login' && 'Access your rotating Susu circles and MoMo wallets.'}
            {tab === 'register' && 'Save and rotate money together in verified circles.'}
            {tab === 'otp' && `Enter the 6-digit code sent to ${phoneNumber}`}
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {tab !== 'otp' && (
            <>
              {/* Continue with Google Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading || loading}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 shadow-xs transition-all cursor-pointer active:scale-95 border border-slate-200"
              >
                {googleLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Clean Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Or with phone number
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Segmented Control (Sign In / Register) */}
              <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    tab === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    tab === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </>
          )}

          {/* SIGN IN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Ghana Phone Number or Email
                </label>
                <div className="relative">
                  {!phoneNumber.includes('@') && (
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-600 pointer-events-none">
                      +233
                    </span>
                  )}
                  <input
                    type={phoneNumber.includes('@') ? 'email' : 'text'}
                    required
                    placeholder="0599360626 or you@gmail.com"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full ${
                      !phoneNumber.includes('@') ? 'pl-14 font-mono' : 'pl-3.5'
                    } pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-bold text-slate-900`}
                  />
                </div>

                {resolvingMoMo && (
                  <p className="text-[11px] text-slate-600 font-medium mt-1 flex items-center gap-1">
                    <RefreshCw size={11} className="animate-spin text-sky-600" /> Resolving MoMo subscriber name...
                  </p>
                )}

                {resolvedMoMoName && (
                  <div className="p-2 mt-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Subscriber: {resolvedMoMoName} ✓</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-900">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
                  >
                    Use SMS Code Instead
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 9 || password.length < 1}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
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
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Ghana MoMo Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-600 pointer-events-none">
                    +233
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="0599360626"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full pl-14 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono font-bold text-slate-900"
                  />
                </div>

                {resolvingMoMo && (
                  <p className="text-[11px] text-slate-600 font-medium mt-1 flex items-center gap-1">
                    <RefreshCw size={11} className="animate-spin text-sky-600" /> Confirming account name...
                  </p>
                )}

                {resolvedMoMoName && (
                  <div className="p-2.5 mt-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Account Name: {resolvedMoMoName} ✓</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Full Legal Name (as on MoMo/Ghana Card)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Full Legal Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
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
                          ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-500/30 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Create Password (min 4 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                💡 This MoMo number will be your automated payment and payout wallet.
              </p>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 9 || password.length < 4 || !fullName.trim()}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
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
            </form>
          )}

          {/* OTP FORM */}
          {tab === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-200">
                  <Smartphone size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Enter Verification Code</h3>
                <p className="text-xs text-slate-600">
                  A 6-digit SMS code was sent to <span className="font-mono font-bold text-slate-900">{phoneNumber}</span>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="••••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full py-3 rounded-2xl bg-slate-50 border border-slate-200 text-center font-mono text-2xl font-bold tracking-[0.5em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="w-full py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Continue</span>}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Change Number
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendCountdown > 0}
                  className="text-sky-700 hover:underline font-bold disabled:opacity-50 cursor-pointer"
                >
                  {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
