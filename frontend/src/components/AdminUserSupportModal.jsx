import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  CreditCard,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';
import { adminManageUser } from '../api/client';

export function AdminUserSupportModal({ user, isOpen, onClose, onUserUpdated }) {
  if (!isOpen || !user) return null;

  const [fullName, setFullName] = useState(user.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || '');
  const [momoProvider, setMomoProvider] = useState(user.momo_provider || 'MTN');
  const [ghanaCard, setGhanaCard] = useState(user.ghana_card_number || '');
  const [kycStatus, setKycStatus] = useState(user.kyc_status || 'UNVERIFIED');
  const [isActive, setIsActive] = useState(user.is_active !== false);
  const [trustScore, setTrustScore] = useState(user.trust_score ?? 100);
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Sync state if user prop updates
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhoneNumber(user.phone_number || '');
      setMomoProvider(user.momo_provider || 'MTN');
      setGhanaCard(user.ghana_card_number || '');
      setKycStatus(user.kyc_status || 'UNVERIFIED');
      setIsActive(user.is_active !== false);
      setTrustScore(user.trust_score ?? 100);
      setNewPassword('');
      setError(null);
      setSuccess(null);
    }
  }, [user]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        full_name: fullName.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
        momo_provider: momoProvider,
        ghana_card_number: ghanaCard.trim() || undefined,
        kyc_status: kycStatus,
        is_active: isActive,
        trust_score: Number(trustScore),
        new_password: newPassword.trim() ? newPassword.trim() : undefined
      };

      const res = await adminManageUser(user.id, payload);
      setSuccess(res.message || 'Saver account updated successfully.');
      if (onUserUpdated) {
        onUserUpdated(res.user);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to update saver account:', err);
      setError(err.response?.data?.detail || 'Failed to update saver account.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickVerify = () => {
    setKycStatus('VERIFIED');
  };

  const handleResetTrust = () => {
    setTrustScore(100);
  };

  const handleToggleActive = () => {
    setIsActive(prev => !prev);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200 shadow-xs">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Member Executive Support</h2>
              <p className="text-[11px] text-slate-500 font-medium">Assist with difficulties, KYC, or unrestrict account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {/* Restriction & Trust Status Box */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Account Health</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {isActive ? <Unlock size={11} /> : <Lock size={11} />}
                    {isActive ? 'Active (Unrestricted)' : 'Frozen / Restricted'}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    Trust: <strong className="text-sky-700">{trustScore}/100</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                  }`}
                >
                  {isActive ? 'Restrict / Freeze' : 'Unrestrict Account'}
                </button>
                <button
                  type="button"
                  onClick={handleResetTrust}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Reset Trust Score back to 100"
                >
                  <RotateCcw size={12} />
                  <span>Reset 100</span>
                </button>
              </div>
            </div>
          </div>

          {/* Member Profile Fields */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Saver Identity Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kwame Mensah"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ghana Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="024XXXXXXX"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">Automatically syncs active circle seats if updated.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">MoMo Provider</label>
                <select
                  value={momoProvider}
                  onChange={(e) => setMomoProvider(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="TELECEL">Telecel Cash</option>
                  <option value="AIRTELTIGO">AT Money</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ghana Card (ID Number)</label>
                <input
                  type="text"
                  value={ghanaCard}
                  onChange={(e) => setGhanaCard(e.target.value)}
                  placeholder="GHA-XXXXXXXXX-X"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>
          </div>

          {/* KYC Status Management */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                KYC Verification Status
              </label>
              {kycStatus !== 'VERIFIED' && (
                <button
                  type="button"
                  onClick={handleQuickVerify}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck size={13} />
                  <span>Verify Now</span>
                </button>
              )}
            </div>
            <select
              value={kycStatus}
              onChange={(e) => setKycStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="VERIFIED">VERIFIED (Full access to all rotation tiers)</option>
              <option value="PENDING">PENDING (Review submitted document)</option>
              <option value="UNVERIFIED">UNVERIFIED (Prompt user for Ghana Card)</option>
            </select>
          </div>

          {/* Security & Password Reset */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Set New Member Password (Optional)
            </label>
            <div className="relative">
              <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep unchanged, or type new password..."
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Provide this new password to the member if they are locked out or cannot reset their password.
            </p>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                <span>Apply Support Updates</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
