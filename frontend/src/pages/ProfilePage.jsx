import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  KeyRound, 
  Smartphone, 
  Building2, 
  Calendar, 
  Award, 
  Gift, 
  HelpCircle, 
  FileText, 
  RotateCcw, 
  Lock, 
  Trash2, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  MessageSquare, 
  HeartHandshake, 
  Camera, 
  RefreshCw, 
  Star,
  Zap,
  Briefcase,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { 
  getProfile, 
  updateProfile, 
  submitKYC, 
  setSecurityPIN, 
  configureWallets, 
  configureAutoDebit, 
  deactivateAccount, 
  deleteAccount 
} from '../api/client';
import { SignatureCanvas } from '../components/SignatureCanvas';
import { FAQModal } from '../components/FAQModal';
import { RegulatoryModal } from '../components/RegulatoryModal';
import confetti from 'canvas-confetti';

export const ProfilePage = ({ onBack, onOpenReferralModal, onOpenTermsModal }) => {
  const { user, isAuthenticated, logout, openAuthModal, refreshProfile } = useUser();
  const [activeTab, setActiveTab] = useState('overview'); // overview, kyc, wallets, security, support
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modals
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isRegulatoryOpen, setIsRegulatoryOpen] = useState(false);
  const [isVersionChecked, setIsVersionChecked] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ratingSheetOpen, setRatingSheetOpen] = useState(false);
  const [userRating, setUserRating] = useState(null);

  // Form States
  const [personalForm, setPersonalForm] = useState({
    full_name: '',
    username: '',
    email: '',
    date_of_birth: '',
    nationality: 'Ghanaian',
    employment_status: 'Employed',
    savings_goal: 'Emergency Fund'
  });

  const [kycForm, setKycForm] = useState({
    ghana_card_number: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relation: 'Sibling',
    employment_status: 'Employed',
    savings_goal: 'Home / Business Capital',
    signature_data: ''
  });

  const [pinForm, setPinForm] = useState({
    pin: '',
    confirm_pin: ''
  });

  const [walletForm, setWalletForm] = useState({
    primary_wallet_provider: 'MTN',
    primary_wallet_number: '',
    bank_name: '',
    bank_account_number: '',
    bank_branch: ''
  });

  const [autoDebitForm, setAutoDebitForm] = useState({
    enabled: false,
    frequency: 'WEEKLY',
    time: '08:00'
  });

  useEffect(() => {
    if (user) {
      setPersonalForm({
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || '',
        date_of_birth: user.date_of_birth || '',
        nationality: user.nationality || 'Ghanaian',
        employment_status: user.employment_status || 'Employed',
        savings_goal: user.savings_goal || 'Emergency Fund'
      });

      setKycForm({
        ghana_card_number: user.ghana_card_number || '',
        next_of_kin_name: user.next_of_kin_name || '',
        next_of_kin_phone: user.next_of_kin_phone || '',
        next_of_kin_relation: user.next_of_kin_relation || 'Sibling',
        employment_status: user.employment_status || 'Employed',
        savings_goal: user.savings_goal || 'Home / Business Capital',
        signature_data: ''
      });

      setWalletForm({
        primary_wallet_provider: user.primary_wallet_provider || user.momo_provider || 'MTN',
        primary_wallet_number: user.primary_wallet_number || user.phone_number || '',
        bank_name: user.bank_name || '',
        bank_account_number: user.bank_account_number || '',
        bank_branch: user.bank_branch || ''
      });

      setAutoDebitForm({
        enabled: user.auto_debit_enabled || false,
        frequency: user.auto_debit_frequency || 'WEEKLY',
        time: user.auto_debit_time || '08:00'
      });
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="py-20 text-center space-y-4 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <User size={32} />
        </div>
        <h2 className="text-xl font-black text-white">Sign In to View Profile</h2>
        <p className="text-xs text-slate-400">
          Manage your Ghana Card KYC verification, multi-rail Mobile Money wallets, and reward points.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg cursor-pointer transition-all active:scale-95"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const triggerSuccess = (msg) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  const handleUpdatePersonal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await updateProfile(personalForm);
      await refreshProfile();
      triggerSuccess('Personal information updated successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update personal details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitKYC = async (e) => {
    e.preventDefault();
    if (!kycForm.ghana_card_number.trim()) {
      setErrorMsg('Please enter your Ghana Card Number (GHA-XXXXXXXXX-X).');
      return;
    }
    if (!kycForm.next_of_kin_name.trim() || !kycForm.next_of_kin_phone.trim()) {
      setErrorMsg('Next of Kin name and phone are required for emergency recovery.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await submitKYC(kycForm);
      await refreshProfile();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      triggerSuccess('🎉 KYC Verified! Silver Tier unlocked & +100 Points awarded!');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'KYC verification submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPIN = async (e) => {
    e.preventDefault();
    if (pinForm.pin !== pinForm.confirm_pin) {
      setErrorMsg('PINs do not match.');
      return;
    }
    if (!/^\d{4}$/.test(pinForm.pin)) {
      setErrorMsg('PIN must be exactly 4 numeric digits.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await setSecurityPIN({ pin: pinForm.pin });
      await refreshProfile();
      setPinForm({ pin: '', confirm_pin: '' });
      triggerSuccess('4-digit Security PIN set successfully for pot payouts!');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to set PIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWallets = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await configureWallets(walletForm);
      await refreshProfile();
      triggerSuccess('Payout wallets updated successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to configure wallets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAutoDebit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await configureAutoDebit(autoDebitForm);
      await refreshProfile();
      triggerSuccess(autoDebitForm.enabled ? 'Scheduled auto-debit activated!' : 'Auto-debit paused.');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update auto-debit.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to temporarily deactivate your account?')) return;
    setLoading(true);
    try {
      await deactivateAccount();
      logout();
    } catch (err) {
      alert('Failed to deactivate account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteAccount();
      setIsDeleteModalOpen(false);
      logout();
    } catch (err) {
      alert(err.response?.data?.detail || 'Cannot delete account with active running rounds.');
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'LEGENDARY':
        return <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">👑 Legendary Saver</span>;
      case 'GOLD':
        return <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">🥇 Gold Achiever</span>;
      case 'SILVER':
        return <span className="bg-slate-300/20 text-slate-200 border border-slate-300/30 px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">🥈 Silver Verified</span>;
      default:
        return <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">🥉 Bronze Starter</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      
      {/* 🧭 Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#141A2D] hover:bg-[#1C233A] border border-white/10 text-slate-300 font-bold text-xs transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFAQOpen(true)}
            className="p-2 rounded-2xl bg-[#141A2D] hover:bg-[#1C233A] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
            title="FAQs"
          >
            <HelpCircle size={16} className="text-amber-400" />
          </button>
          <button
            onClick={() => setIsRegulatoryOpen(true)}
            className="p-2 rounded-2xl bg-[#141A2D] hover:bg-[#1C233A] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
            title="Compliance & Licenses"
          >
            <ShieldCheck size={16} className="text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 🌟 1. User Header & Gamification Card */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-[#141A2D] via-[#0E1322] to-[#141A2D] p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.5)] border-2 border-white/15">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-3xl" />
                ) : (
                  <span>{user.full_name?.charAt(0) || '₵'}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#080B11] flex items-center justify-center text-[10px] text-white" title="Active">
                ✓
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{user.full_name}</h1>
                {getTierBadge(user.tier)}
              </div>
              <p className="text-xs font-mono text-slate-400">@{user.username || `saver_${user.phone_number?.slice(-4)}`}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-300 font-bold">
                <span>🇬🇭 {user.nationality || 'Ghanaian'}</span>
                <span>•</span>
                <span className="text-amber-400 font-mono">{user.phone_number}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-[#080B11]/80 border border-white/10 text-center min-w-[100px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">Trust Score</div>
              <div className="text-lg font-black text-emerald-400 font-mono flex items-center justify-center gap-1">
                <Star size={14} className="fill-emerald-400" />
                <span>{user.trust_score || 100}%</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#080B11]/80 border border-white/10 text-center min-w-[100px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">Reward Points</div>
              <div className="text-lg font-black text-amber-400 font-mono flex items-center justify-center gap-1">
                <Zap size={14} className="fill-amber-400" />
                <span>{user.points || 50}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Interactive Reward Banner */}
        <div 
          onClick={onOpenReferralModal}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-gold-500/20 to-blue-500/15 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:border-amber-400/60 transition-all shadow-inner group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
              <Gift size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-200">Refer & Earn 10 Points</h4>
              <p className="text-[11px] text-slate-300">Invite trusted savers to your Susu groups and boost your tier score.</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-amber-300 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* 🚀 Tab Navigation Hierarchy */}
      <div className="flex items-center gap-1.5 p-1 bg-[#141A2D] rounded-2xl border border-white/10 overflow-x-auto">
        {[
          { id: 'overview', label: 'Personal Info', icon: User },
          { id: 'kyc', label: 'KYC & Ghana Card', icon: ShieldCheck },
          { id: 'wallets', label: 'Payout Wallets', icon: Smartphone },
          { id: 'security', label: 'Security & PIN', icon: KeyRound },
          { id: 'support', label: 'App & Legal', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-2">
          <CheckCircle2 size={16} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 📝 Tab 1: Personal Information */}
      {activeTab === 'overview' && (
        <div className="dark-card rounded-3xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <User className="text-blue-400" size={18} />
            <h3 className="text-sm font-black text-white">Personal Information</h3>
          </div>

          <form onSubmit={handleUpdatePersonal} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Full Legal Name</label>
                <input
                  type="text"
                  value={personalForm.full_name}
                  onChange={(e) => setPersonalForm({ ...personalForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Username (@)</label>
                <input
                  type="text"
                  value={personalForm.username}
                  onChange={(e) => setPersonalForm({ ...personalForm, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Email Address</label>
                <input
                  type="email"
                  value={personalForm.email}
                  onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Date of Birth</label>
                <input
                  type="date"
                  value={personalForm.date_of_birth}
                  onChange={(e) => setPersonalForm({ ...personalForm, date_of_birth: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Employment Status</label>
                <select
                  value={personalForm.employment_status}
                  onChange={(e) => setPersonalForm({ ...personalForm, employment_status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Employed">Employed</option>
                  <option value="Self-Employed / Trader">Self-Employed / Trader</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Student">Student</option>
                  <option value="Civil Servant">Civil Servant</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Primary Savings Goal</label>
                <select
                  value={personalForm.savings_goal}
                  onChange={(e) => setPersonalForm({ ...personalForm, savings_goal: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Business Capital">Business Capital</option>
                  <option value="School Fees">School Fees</option>
                  <option value="Rent / Housing">Rent / Housing</option>
                  <option value="Equipment & Asset Purchase">Equipment & Asset Purchase</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Personal Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 🛡️ Tab 2: KYC & Ghana Card Verification */}
      {activeTab === 'kyc' && (
        <div className="dark-card rounded-3xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={18} />
              <h3 className="text-sm font-black text-white">KYC & Ghana Card Identification</h3>
            </div>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
              user.kyc_status === 'VERIFIED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {user.kyc_status === 'VERIFIED' ? '✓ KYC Verified' : 'Action Required'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-200 text-xs leading-relaxed space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-300" />
              <span>Bank of Ghana Tier 1 FinTech Standard</span>
            </p>
            <p className="text-[11px] text-slate-300">
              Verifying your Ghana Card and Next of Kin emergency details unlocks <strong>Silver/Gold Tier</strong>, raises your payout limit, and prevents default risks in Susu circles.
            </p>
          </div>

          <form onSubmit={handleSubmitKYC} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-slate-300 font-bold">Ghana Card PIN Number</label>
                <input
                  type="text"
                  placeholder="GHA-712345678-9"
                  value={kycForm.ghana_card_number}
                  onChange={(e) => setKycForm({ ...kycForm, ghana_card_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white font-mono text-xs uppercase focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="text-[10px] text-slate-500">Format: GHA-XXXXXXXXX-X</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Next of Kin Full Name</label>
                <input
                  type="text"
                  placeholder="Next of Kin Legal Name"
                  value={kycForm.next_of_kin_name}
                  onChange={(e) => setKycForm({ ...kycForm, next_of_kin_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Next of Kin Phone Number</label>
                <input
                  type="tel"
                  placeholder="0244123456"
                  value={kycForm.next_of_kin_phone}
                  onChange={(e) => setKycForm({ ...kycForm, next_of_kin_phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Relationship to Next of Kin</label>
                <select
                  value={kycForm.next_of_kin_relation}
                  onChange={(e) => setKycForm({ ...kycForm, next_of_kin_relation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Parent">Parent</option>
                  <option value="Child / Dependant">Child / Dependant</option>
                  <option value="Business Partner">Business Partner</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Live Selfie Guidelines</label>
                <div className="p-3 rounded-2xl bg-[#080B11] border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                    <Camera size={16} />
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Selfie with neutral background verified via Ghana Card link.
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Signature Capture */}
            <div className="pt-2">
              <SignatureCanvas
                onSave={(sigData) => setKycForm({ ...kycForm, signature_data: sigData })}
                initialSignature={user.signature_data}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Submitting Verification...' : 'Submit Ghana Card & KYC'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 💳 Tab 3: Multi-Rail Wallets & Scheduled Top-ups */}
      {activeTab === 'wallets' && (
        <div className="space-y-6">
          
          {/* Preferred Payout Wallet */}
          <div className="dark-card rounded-3xl p-6 border border-white/5 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Smartphone className="text-amber-400" size={18} />
              <h3 className="text-sm font-black text-white">Preferred Payout Wallet (Deposit & Withdrawal)</h3>
            </div>

            <form onSubmit={handleSaveWallets} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Primary Network / Rail</label>
                  <select
                    value={walletForm.primary_wallet_provider}
                    onChange={(e) => setWalletForm({ ...walletForm, primary_wallet_provider: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="MTN">MTN Mobile Money (*170#)</option>
                    <option value="TELECEL">Telecel Cash (*110#)</option>
                    <option value="AT">AT Money (*110#)</option>
                    <option value="BANK">Commercial Bank Account</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Mobile Money Payout Number</label>
                  <input
                    type="tel"
                    value={walletForm.primary_wallet_number}
                    onChange={(e) => setWalletForm({ ...walletForm, primary_wallet_number: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white font-mono text-xs focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {walletForm.primary_wallet_provider === 'BANK' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. GCB Bank, Ecobank, Absa"
                        value={walletForm.bank_name}
                        onChange={(e) => setWalletForm({ ...walletForm, bank_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold">Bank Account Number</label>
                      <input
                        type="text"
                        placeholder="Account Number"
                        value={walletForm.bank_account_number}
                        onChange={(e) => setWalletForm({ ...walletForm, bank_account_number: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white font-mono text-xs"
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Primary Payout Wallet'}
              </button>
            </form>
          </div>

          {/* Automated Scheduled Top-Ups */}
          <div className="dark-card rounded-3xl p-6 border border-white/5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="text-blue-400" size={18} />
                <h3 className="text-sm font-black text-white">Automated Scheduled Top-Ups</h3>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                autoDebitForm.enabled
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-white/10 text-slate-400'
              }`}>
                {autoDebitForm.enabled ? 'Active Schedule' : 'Disabled'}
              </span>
            </div>

            <form onSubmit={handleSaveAutoDebit} className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#080B11] border border-white/5">
                <input
                  type="checkbox"
                  id="auto_debit_toggle"
                  checked={autoDebitForm.enabled}
                  onChange={(e) => setAutoDebitForm({ ...autoDebitForm, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="auto_debit_toggle" className="text-xs font-bold text-white cursor-pointer select-none">
                  Enable automated round contribution prompt reminders
                </label>
              </div>

              {autoDebitForm.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">Schedule Frequency</label>
                    <select
                      value={autoDebitForm.frequency}
                      onChange={(e) => setAutoDebitForm({ ...autoDebitForm, frequency: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DAILY">Daily at Scheduled Time</option>
                      <option value="WEEKLY">Weekly (Monday 08:00 AM)</option>
                      <option value="MONTHLY">Monthly (1st of Every Month)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">Time of Day (GMT)</label>
                    <input
                      type="time"
                      value={autoDebitForm.time}
                      onChange={(e) => setAutoDebitForm({ ...autoDebitForm, time: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Schedule'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* 🔐 Tab 4: Security & 4-Digit Pot PIN */}
      {activeTab === 'security' && (
        <div className="dark-card rounded-3xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="text-indigo-400" size={18} />
              <h3 className="text-sm font-black text-white">4-Digit Security PIN for Pot Disbursements</h3>
            </div>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
              user.has_security_pin
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {user.has_security_pin ? 'PIN Active' : 'Not Set'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Your 4-digit Security PIN is required to authorize the receipt and payout disbursement of high-value lump-sum pots, protecting your funds from unauthorized access.
          </p>

          <form onSubmit={handleSetPIN} className="space-y-4 text-xs max-w-sm">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold">Set 4-Digit Security PIN</label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pinForm.pin}
                onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-center font-mono text-base tracking-widest focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold">Confirm 4-Digit Security PIN</label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pinForm.confirm_pin}
                onChange={(e) => setPinForm({ ...pinForm, confirm_pin: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-white/10 text-white text-center font-mono text-base tracking-widest focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || pinForm.pin.length !== 4}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving...' : user.has_security_pin ? 'Update Security PIN' : 'Activate 4-Digit PIN'}
            </button>
          </form>
        </div>
      )}

      {/* ⚙️ Tab 5: App Lifecycle, Support & Legal */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          
          {/* Support & Legal Links */}
          <div className="dark-card rounded-3xl p-6 border border-white/5 space-y-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Layers className="text-blue-400" size={18} />
              <h3 className="text-sm font-black text-white">Support, Compliance & Documents</h3>
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => setIsFAQOpen(true)}
                className="w-full p-3.5 rounded-2xl bg-[#080B11] hover:bg-[#0E1322] border border-white/5 flex items-center justify-between text-left text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={16} className="text-amber-400" />
                  <span className="font-bold">Frequently Asked Questions (FAQs)</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </button>

              <button
                onClick={() => setIsRegulatoryOpen(true)}
                className="w-full p-3.5 rounded-2xl bg-[#080B11] hover:bg-[#0E1322] border border-white/5 flex items-center justify-between text-left text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span className="font-bold">Bank of Ghana & Coratech Global Licenses</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </button>

              <button
                onClick={onOpenTermsModal}
                className="w-full p-3.5 rounded-2xl bg-[#080B11] hover:bg-[#0E1322] border border-white/5 flex items-center justify-between text-left text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-blue-400" />
                  <span className="font-bold">Terms of Service & Privacy Policy</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </button>

              <a
                href="https://wa.me/233244000000?text=Hello%20Coratech%20Global%20Support"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3.5 rounded-2xl bg-[#080B11] hover:bg-[#0E1322] border border-white/5 flex items-center justify-between text-left text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={16} className="text-emerald-400" />
                  <span className="font-bold">WhatsApp Live Support (Coratech Global)</span>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </a>
            </div>
          </div>

          {/* Version & Account Lifecycle */}
          <div className="dark-card rounded-3xl p-6 border border-white/5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white">Check for Updates</div>
                <div className="text-[11px] text-slate-400">SusuRow v1.5.0 (Build 2026)</div>
              </div>
              <button
                onClick={() => {
                  setIsVersionChecked(true);
                  setTimeout(() => setIsVersionChecked(false), 3000);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer"
              >
                {isVersionChecked ? '✓ Up to date' : 'Check Version'}
              </button>
            </div>

            <div className="border-t border-white/5 pt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleDeactivate}
                className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                Pause / Deactivate Account
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                Delete Account
              </button>

              <button
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 🗑️ Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04060A]/85 backdrop-blur-md">
          <div className="dark-card w-full max-w-md rounded-3xl p-6 border border-white/10 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Account</h3>
                <p className="text-xs text-slate-400">Permanent Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete your SusuRow account? This will remove your KYC records and points. Accounts enrolled in active running circles cannot be deleted until all rounds finish.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-[#1C233A] text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      <FAQModal
        isOpen={isFAQOpen}
        onClose={() => setIsFAQOpen(false)}
      />

      {/* Regulatory Modal */}
      <RegulatoryModal
        isOpen={isRegulatoryOpen}
        onClose={() => setIsRegulatoryOpen(false)}
      />

    </div>
  );
};
