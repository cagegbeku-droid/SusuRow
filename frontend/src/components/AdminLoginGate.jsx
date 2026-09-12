import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, ArrowLeft, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { adminLogin } from '../api/client';
import AdminDashboardPage from '../pages/AdminDashboardPage';

export const AdminLoginGate = ({ onBack }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('susurow_admin_auth') === 'true' && Boolean(localStorage.getItem('susurow_auth_token'));
  });

  const [adminUsername, setAdminUsername] = useState(() => {
    try {
      const saved = localStorage.getItem('susurow_custom_admin_creds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username) return parsed.username;
      }
    } catch (e) {}
    return '0599360626';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await adminLogin({
        username: adminUsername.trim(),
        password: adminPassword
      });

      if (res && res.access_token) {
        // Save auth token to localStorage so all admin APIs are fully authorized
        localStorage.setItem('susurow_auth_token', res.access_token);
        if (res.user) {
          localStorage.setItem('susurow_auth_user', JSON.stringify(res.user));
        }
        sessionStorage.setItem('susurow_admin_auth', 'true');
        setIsAdminAuthenticated(true);
      } else {
        throw new Error('No authentication token received.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      const msg = err.response?.data?.detail || err.message || 'Incorrect administrator phone/ID or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLockSession = () => {
    sessionStorage.removeItem('susurow_admin_auth');
    setIsAdminAuthenticated(false);
    if (onBack) onBack();
  };

  if (isAdminAuthenticated) {
    return (
      <AdminDashboardPage 
        onBack={handleLockSession} 
        onLockSession={handleLockSession}
      />
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Badge */}
        <div className="bg-white border-b border-slate-100 p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs mb-3">
            <ShieldCheck size={28} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200">
            Executive Management Portal
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Executive Admin Sign In</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Sign in with your administrator phone or ID to manage circles, members, and escrow float.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Administrator Phone / ID
            </label>
            <input
              type="text"
              required
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="e.g. 0599360626"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Executive Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-amber-400 font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <KeyRound size={16} />
            <span>{loading ? 'Signing in...' : 'Sign In as Executive'}</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Public App</span>
          </button>
        </form>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <span className="text-[10px] text-slate-400 font-medium">
            SusuRow Security • Dedicated Executive Management
          </span>
        </div>

      </div>
    </div>
  );
};

export default AdminLoginGate;
