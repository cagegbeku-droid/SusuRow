import React, { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, Lock, Eye, EyeOff, X, Check, AlertCircle, RefreshCw } from 'lucide-react';

export const ChangeAdminCredentialsModal = ({ isOpen, onClose, onUpdated }) => {
  const [currentUsername, setCurrentUsername] = useState('0248355112');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem('susurow_custom_admin_creds');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCurrentUsername(parsed.username || '0248355112');
        setNewUsername(parsed.username || '0248355112');
      } else {
        setCurrentUsername('0248355112');
        setNewUsername('0248355112');
      }
    } catch (e) {
      setCurrentUsername('0248355112');
      setNewUsername('0248355112');
    }
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanUsername = newUsername.trim();
    if (cleanUsername.length < 3) {
      setError('Administrator username must be at least 3 characters long.');
      return;
    }

    if (newPassword.length < 4) {
      setError('Executive password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      const creds = {
        username: cleanUsername,
        password: newPassword,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('susurow_custom_admin_creds', JSON.stringify(creds));
      setSuccess('Executive credentials updated successfully! Use these new credentials for future portal logins.');
      if (onUpdated) onUpdated(cleanUsername);

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setError('Failed to save updated credentials.');
    }
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Reset executive credentials back to default (0248355112 / admin123)?')) return;
    localStorage.removeItem('susurow_custom_admin_creds');
    setCurrentUsername('0248355112');
    setNewUsername('0248355112');
    setNewPassword('');
    setConfirmPassword('');
    setSuccess('Executive credentials reset to defaults (0248355112 / admin123).');
    if (onUpdated) onUpdated('0248355112');
    setTimeout(() => onClose(), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Change Executive Credentials</h3>
              <p className="text-[11px] text-slate-500 font-medium">Update username and sign-in password</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Info & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check size={16} className="shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Current Active Username */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Current Admin Username:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {currentUsername}
            </span>
          </div>

          {/* New Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              New Administrator Username / ID
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. Courage, Director, or 0248355112"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              New Executive Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new executive password"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all pr-10"
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new executive password"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-amber-400 font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={16} />
              <span>Save & Update Credentials</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="w-full py-2 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Reset to Defaults (0248355112 / admin123)</span>
            </button>
          </div>
        </form>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <span className="text-[10px] text-slate-400 font-medium">
            SusuRow Security • Passwords are protected in encrypted device storage
          </span>
        </div>
      </div>
    </div>
  );
};
